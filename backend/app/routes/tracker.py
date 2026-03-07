# app/routes/tracker.py
from fastapi import APIRouter, Request, HTTPException
from app.database import applications_col
from app.routes.auth import decode_token, get_token_from_request
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/tracker", tags=["Tracker"])

VALID_STATUSES = ["saved", "applied", "interview", "offer", "rejected"]

def get_user_id(request: Request) -> str:
    token = get_token_from_request(request)
    return decode_token(token)["sub"]

class ApplicationRequest(BaseModel):
    job_id:       str
    title:        str
    company:      str
    location:     str | None = None
    url:          str | None = None
    salary:       str | None = None
    status:       str = "saved"
    notes:        str | None = None
    applied_date: str | None = None

class UpdateStatusRequest(BaseModel):
    status: str
    notes:  str | None = None

@router.post("/")
async def add_application(data: ApplicationRequest, request: Request):
    user_id = get_user_id(request)
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid status")
    existing = await applications_col.find_one({"user_id": user_id, "job_id": data.job_id})
    if existing:
        raise HTTPException(status_code=409, detail="Already tracking")
    result = await applications_col.insert_one({
        "user_id": user_id, "job_id": data.job_id,
        "title": data.title, "company": data.company,
        "location": data.location, "url": data.url,
        "salary": data.salary, "status": data.status,
        "notes": data.notes, "applied_date": data.applied_date,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    })
    return {"id": str(result.inserted_id)}

@router.get("/stats")
async def get_stats(request: Request):
    user_id  = get_user_id(request)
    pipeline = [{"$match": {"user_id": user_id}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    stats    = {s: 0 for s in VALID_STATUSES}
    async for doc in applications_col.aggregate(pipeline):
        stats[doc["_id"]] = doc["count"]
    return {"stats": stats, "total": sum(stats.values())}

@router.get("/")
async def get_applications(request: Request):
    user_id = get_user_id(request)
    apps    = []
    async for doc in applications_col.find({"user_id": user_id}).sort("updated_at", -1):
        doc["id"] = str(doc["_id"]); del doc["_id"]
        apps.append(doc)
    return {"applications": apps}

@router.patch("/{app_id}")
async def update_application(app_id: str, data: UpdateStatusRequest, request: Request):
    user_id = get_user_id(request)
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid status")
    update = {"status": data.status, "updated_at": datetime.utcnow().isoformat()}
    if data.notes is not None:
        update["notes"] = data.notes
    result = await applications_col.update_one(
        {"_id": ObjectId(app_id), "user_id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Updated"}

@router.delete("/{app_id}")
async def delete_application(app_id: str, request: Request):
    user_id = get_user_id(request)
    result  = await applications_col.delete_one({"_id": ObjectId(app_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}