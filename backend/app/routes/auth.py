# app/routes/auth.py
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
import httpx

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY        = os.getenv("SECRET_KEY", "change-this-secret-in-production")
ALGORITHM         = "HS256"
TOKEN_EXPIRE_DAYS = 7
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/api/auth/google/callback")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Fake DB — replace with MongoDB later ────────────────
fake_users_db: dict[str, dict] = {}

def get_user_by_email(email: str):
    return fake_users_db.get(email)

def create_user(name: str, email: str, hashed_password=None, google_id=None):
    user = {
        "id": str(len(fake_users_db) + 1),
        "name": name, "email": email,
        "hashed_password": hashed_password,
        "google_id": google_id,
    }
    fake_users_db[email] = user
    return user

# ─── JWT ─────────────────────────────────────────────────
def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "email": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_token_from_request(request: Request) -> str:
    """Read Bearer token from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return auth.split(" ", 1)[1]

def safe_user(user: dict) -> dict:
    return {"id": user["id"], "name": user["name"], "email": user["email"]}

# ─── Schemas ─────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ─── Routes ──────────────────────────────────────────────
@router.post("/register", status_code=201)
def register(data: RegisterRequest):
    if get_user_by_email(data.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(data.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    hashed = pwd_context.hash(data.password)
    user   = create_user(name=data.name, email=data.email, hashed_password=hashed)
    token  = create_access_token(user["id"], user["email"])
    return {"token": token, "user": safe_user(user)}

@router.post("/login")
def login(data: LoginRequest):
    user = get_user_by_email(data.email)
    if not user or not user.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not pwd_context.verify(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": safe_user(user)}

@router.post("/logout")
def logout():
    # With localStorage tokens, logout is handled client-side
    return {"message": "Logged out"}

@router.get("/me")
def get_me(request: Request):
    token   = get_token_from_request(request)
    payload = decode_token(token)
    user    = get_user_by_email(payload.get("email"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return safe_user(user)

# ─── Google OAuth ─────────────────────────────────────────
@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    params = "&".join([
        "response_type=code",
        f"client_id={GOOGLE_CLIENT_ID}",
        f"redirect_uri={GOOGLE_REDIRECT_URI}",
        "scope=openid%20email%20profile",
        "access_type=offline",
    ])
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")

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
        raise HTTPException(status_code=400, detail="Failed to exchange Google code")

    access_token = token_res.json().get("access_token")

    async with httpx.AsyncClient() as client:
        profile_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if profile_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Google profile")

    profile = profile_res.json()
    email   = profile.get("email")
    name    = profile.get("name", email)

    user = get_user_by_email(email)
    if not user:
        user = create_user(name=name, email=email, google_id=profile.get("id"))

    # Pass token in URL — frontend stores it in localStorage
    jwt_token = create_access_token(user["id"], user["email"])
    return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}", status_code=302)