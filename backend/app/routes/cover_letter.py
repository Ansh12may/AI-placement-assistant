# app/routes/cover_letter.py
from fastapi import APIRouter, Request, HTTPException
from app.database import cover_letters_col
from app.routes.auth import decode_token, get_token_from_request
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import os

router = APIRouter(prefix="/coverletter", tags=["Cover Letter"])

def get_user_id(request: Request) -> str:
    token = get_token_from_request(request)
    return decode_token(token)["sub"]

class CoverLetterRequest(BaseModel):
    job_title:       str
    company:         str
    job_description: str
    user_name:       str | None = None
    user_skills:     list[str] = []
    tone:            str = "professional"

class SaveCoverLetterRequest(BaseModel):
    job_title: str
    company:   str
    content:   str

@router.post("/generate")
async def generate_cover_letter(data: CoverLetterRequest, request: Request):
    get_user_id(request)
    
    # TRY GEMINI
    try:
        from app.agents.cover_letter_agent import CoverLetterAgent
        result = CoverLetterAgent().generate(
            job_title=data.job_title, company=data.company,
            job_description=data.job_description, user_name=data.user_name,
            skills=data.user_skills, tone=data.tone
        )
        return {"cover_letter": result}  # Gemini success
        
    # CATCH ANY GEMINI FAILURE → OPENAI
    except Exception:  # ImportError, ModelError, APIError, etc.
        print("🔄 Gemini failed → OpenAI")
        
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user", 
                "content": f"Write {data.tone} cover letter for {data.job_title} at {data.company}. Skills: {data.user_skills}. JD: {data.job_description}"
            }]
        )
        return {"cover_letter": response.choices[0].message.content}  # ✅ OpenAI success

@router.post("/save")
async def save_cover_letter(data: SaveCoverLetterRequest, request: Request):
    user_id = get_user_id(request)
    result  = await cover_letters_col.insert_one({
        "user_id": user_id, "job_title": data.job_title,
        "company": data.company, "content": data.content,
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"id": str(result.inserted_id)}

@router.get("/")
async def get_cover_letters(request: Request):
    user_id = get_user_id(request)
    letters = []
    async for doc in cover_letters_col.find({"user_id": user_id}, {"content": 0}).sort("created_at", -1):
        doc["id"] = str(doc["_id"]); del doc["_id"]
        letters.append(doc)
    return {"cover_letters": letters}

@router.delete("/{letter_id}")
async def delete_cover_letter(letter_id: str, request: Request):
    user_id = get_user_id(request)
    result  = await cover_letters_col.delete_one({"_id": ObjectId(letter_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}