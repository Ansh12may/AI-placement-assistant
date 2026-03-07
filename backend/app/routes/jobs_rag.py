# app/routes/jobs_rag.py
# Add this endpoint to your existing jobs router

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.agents.embeddings import rank_jobs_by_similarity
from app.routes.auth import get_token_from_request

router = APIRouter()

class RAGMatchRequest(BaseModel):
    resume_data: dict
    location:    str = "India"
    count:       int = 9


@router.post("/match")
async def rag_job_match(data: RAGMatchRequest, request: Request):
    """
    RAG-based job matching.
    1. Fetch jobs via SerpAPI using job_title + skills
    2. Embed resume + each job via OpenAI
    3. Rank by cosine similarity
    4. Return top N jobs with match_score
    """
    get_token_from_request(request)  # verify auth

    job_title = data.resume_data.get("job_title", "software engineer")
    skills    = data.resume_data.get("skills", [])

    # Step 1 — fetch candidate pool (3x count so RAG has enough to rank)
    try:
        from app.agents.job_matcher import JobSearchAgent
        agent = JobSearchAgent()
        jobs  = agent.search_jobs(
            resume_data=data.resume_data,   # ← passes skills internally
            keywords=job_title,
            location=data.location,
            count=data.count * 3,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job fetch failed: {str(e)}")

    if not jobs:
        return {"jobs": [], "total": 0, "message": "No jobs found to match against"}

    # Step 2 — rank by semantic similarity using embeddings
    try:
        from app.agents.embeddings import rank_jobs_by_similarity
        ranked = rank_jobs_by_similarity(
            resume_data=data.resume_data,
            jobs=jobs,
            top_n=data.count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    return {
        "jobs":   ranked,
        "total":  len(ranked),
        "method": "rag_embedding",
    }