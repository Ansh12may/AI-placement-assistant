from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from app.agents.job_matcher import JobSearchAgent
from app.agents.job_fit_scorer import JobFitScorer
from app.agents.embeddings import rank_jobs_by_similarity

router = APIRouter(prefix="/jobs", tags=["Jobs"])
job_agent = JobSearchAgent()
fit_scorer = JobFitScorer()


class FitScoreRequest(BaseModel):
    resume_data: dict
    job_data: dict


@router.post("/search")
def search_jobs(payload: dict = Body(...)):
    """Keyword search — uses job title + skills to query SerpAPI."""
    keywords = payload.get("keywords")
    location = payload.get("location", "India")
    skills   = payload.get("skills", [])
    count    = payload.get("count", 9)

    if not keywords:
        raise HTTPException(status_code=400, detail="keywords required")

    jobs = job_agent.search_jobs(
        resume_data={"skills": skills},
        keywords=keywords,
        location=location,
        count=count,
    )
    return {"success": True, "jobs": jobs}


@router.post("/match")
def match_jobs(payload: dict = Body(...)):
    """
    RAG-based job matching.
    1. Extract job_title + skills from resume_data
    2. Fetch jobs from SerpAPI using real keywords
    3. Embed resume + jobs via OpenAI
    4. Rank by cosine similarity
    5. Return top N with match_score
    """
    resume_data = payload.get("resume_data")
    location    = payload.get("location", "India")
    count       = payload.get("count", 9)

    if not resume_data:
        raise HTTPException(status_code=400, detail="resume_data required")

    # ── Fix: use actual job_title from resume, not None ──
    job_title = resume_data.get("job_title") or "software engineer"
    skills    = resume_data.get("skills", [])

    # Step 1 — fetch 3x jobs so RAG has enough to rank
    try:
        jobs = job_agent.search_jobs(
            resume_data=resume_data,
            keywords=job_title,        # ← FIXED: was None
            location=location,
            count=count * 3,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job fetch failed: {str(e)}")

    if not jobs:
        return {"success": True, "jobs": [], "message": "No jobs found"}

    # Step 2 — rank by semantic similarity
    try:
        ranked = rank_jobs_by_similarity(
            resume_data=resume_data,
            jobs=jobs,
            top_n=count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    return {"success": True, "jobs": ranked, "total": len(ranked), "method": "rag_embedding"}


@router.post("/fit-score")
def score_job_fit(request: FitScoreRequest):
    """Multi-dimensional fit score between a resume and a job."""
    if not request.resume_data:
        raise HTTPException(status_code=400, detail="resume_data is required")
    if not request.job_data:
        raise HTTPException(status_code=400, detail="job_data is required")

    try:
        result = fit_scorer.score(request.resume_data, request.job_data)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fit scoring failed: {str(e)}")