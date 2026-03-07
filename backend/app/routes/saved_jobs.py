# app/routes/saved_jobs.py
from fastapi import APIRouter, Request, HTTPException
from app.database import saved_jobs_col
from app.routes.auth import decode_token, get_token_from_request
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/jobs", tags=["Saved Jobs"])

def get_user_id(request: Request) -> str:
    token = get_token_from_request(request)
    return decode_token(token)["sub"]

class SaveJobRequest(BaseModel):
    job_id:      str
    title:       str
    company:     str
    location:    str | None = None
    description: str | None = None
    url:         str | None = None
    salary:      str | None = None

@router.post("/save")
async def save_job(data: SaveJobRequest, request: Request):
    user_id = get_user_id(request)
    existing = await saved_jobs_col.find_one({"user_id": user_id, "job_id": data.job_id})
    if existing:
        raise HTTPException(status_code=409, detail="Job already saved")
    await saved_jobs_col.insert_one({
        "user_id": user_id, "job_id": data.job_id,
        "title": data.title, "company": data.company,
        "location": data.location, "description": data.description,
        "url": data.url, "salary": data.salary,
        "saved_at": datetime.utcnow().isoformat(),
    })
    return {"message": "Job saved"}

@router.delete("/save/{job_id}")
async def unsave_job(job_id: str, request: Request):
    user_id = get_user_id(request)
    result  = await saved_jobs_col.delete_one({"user_id": user_id, "job_id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Removed"}

@router.get("/saved")
async def get_saved_jobs(request: Request):
    user_id = get_user_id(request)
    cursor  = saved_jobs_col.find({"user_id": user_id}, {"_id": 0}).sort("saved_at", -1)
    return {"jobs": await cursor.to_list(length=100)}