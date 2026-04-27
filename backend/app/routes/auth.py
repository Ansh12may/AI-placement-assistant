# app/routes/auth.py

import os
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
import httpx

from app.database import users_col

router = APIRouter(prefix="/auth", tags=["Auth"])

# ─── Config ──────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://127.0.0.1:8000/auth/google/callback"
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── MongoDB Helpers ─────────────────────────────────────

async def get_user_by_email(email: str):
    return await users_col.find_one({"email": email})


async def create_user(
    name: str,
    email: str,
    hashed_password=None,
    google_id=None
):
    user = {
        "name": name,
        "email": email,
        "hashed_password": hashed_password,
        "google_id": google_id,
    }

    result = await users_col.insert_one(user)
    user["_id"] = result.inserted_id
    return user


# ─── JWT Helpers ─────────────────────────────────────────

def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


def get_token_from_request(request: Request) -> str:
    auth = request.headers.get("Authorization", "")

    if not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    return auth.split(" ", 1)[1]


def safe_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"]
    }


# ─── Request Schemas ─────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Normal Auth Routes ──────────────────────────────────

@router.post("/register", status_code=201)
async def register(data: RegisterRequest):
    existing_user = await get_user_by_email(data.email)

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 8 characters"
        )

    hashed_password = pwd_context.hash(data.password)

    user = await create_user(
        name=data.name,
        email=data.email,
        hashed_password=hashed_password
    )

    token = create_access_token(
        str(user["_id"]),
        user["email"]
    )

    return {
        "token": token,
        "user": safe_user(user)
    }


@router.post("/login")
async def login(data: LoginRequest):
    user = await get_user_by_email(data.email)

    if not user or not user.get("hashed_password"):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not pwd_context.verify(
        data.password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        str(user["_id"]),
        user["email"]
    )

    return {
        "token": token,
        "user": safe_user(user)
    }


@router.post("/logout")
def logout():
    return {
        "message": "Logged out"
    }


@router.get("/me")
async def get_me(request: Request):
    token = get_token_from_request(request)

    payload = decode_token(token)

    email = payload.get("email")

    user = await get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return safe_user(user)


# ─── Google OAuth ────────────────────────────────────────

@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured"
        )

    params = "&".join([
        "response_type=code",
        f"client_id={GOOGLE_CLIENT_ID}",
        f"redirect_uri={GOOGLE_REDIRECT_URI}",
        "scope=openid%20email%20profile",
        "access_type=offline",
    ])

    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    )

    return RedirectResponse(google_url)


@router.get("/google/callback")
async def google_callback(code: str):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_res.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to exchange Google code"
        )

    access_token = token_res.json().get("access_token")

    async with httpx.AsyncClient() as client:
        profile_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
        )

    if profile_res.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to fetch Google profile"
        )

    profile = profile_res.json()

    email = profile.get("email")
    name = profile.get("name", email)
    google_id = profile.get("id")

    user = await get_user_by_email(email)

    if not user:
        user = await create_user(
            name=name,
            email=email,
            google_id=google_id
        )

    jwt_token = create_access_token(
        str(user["_id"]),
        user["email"]
    )

    return RedirectResponse(
        url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}",
        status_code=302
    )