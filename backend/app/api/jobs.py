from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel

from app.agents.job_matcher import JobSearchAgent
from app.agents.job_fit_scorer import JobFitScorer
from app.agents.embeddings import rank_jobs_by_similarity

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


class FitScoreRequest(BaseModel):
    resume_data: dict
    job_data: dict


@router.post("/search")
def search_jobs(payload: dict = Body(...)):
    """
    Keyword search using job title + skills to query jobs.
    """

    keywords = payload.get("keywords")
    location = payload.get("location", "India")
    skills = payload.get("skills", [])
    count = payload.get("count", 9)

    if not keywords:
        raise HTTPException(
            status_code=400,
            detail="keywords required"
        )

    # Lazy initialization (important for Render)
    job_agent = JobSearchAgent()

    try:
        jobs = job_agent.search_jobs(
            resume_data={
                "skills": skills
            },
            keywords=keywords,
            location=location,
            count=count,
        )

        return {
            "success": True,
            "jobs": jobs
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job search failed: {str(e)}"
        )


@router.post("/match")
def match_jobs(payload: dict = Body(...)):
    """
    RAG-based job matching

    Steps:
    1. Extract job title + skills from resume
    2. Fetch jobs using job title
    3. Generate embeddings
    4. Rank by cosine similarity
    5. Return top matches
    """

    resume_data = payload.get("resume_data")
    location = payload.get("location", "India")
    count = payload.get("count", 9)

    if not resume_data:
        raise HTTPException(
            status_code=400,
            detail="resume_data required"
        )

    job_title = (
        resume_data.get("job_title")
        or "software engineer"
    )

    skills = resume_data.get("skills", [])

    # Lazy initialization (important for Render)
    job_agent = JobSearchAgent()

    # Step 1: Fetch jobs
    try:
        jobs = job_agent.search_jobs(
            resume_data=resume_data,
            keywords=job_title,
            location=location,
            count=count * 3,  # fetch extra for ranking
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job fetch failed: {str(e)}"
        )

    if not jobs:
        return {
            "success": True,
            "jobs": [],
            "message": "No jobs found"
        }

    # Step 2: Rank using embeddings
    try:
        ranked = rank_jobs_by_similarity(
            resume_data=resume_data,
            jobs=jobs,
            top_n=count,
        )

        return {
            "success": True,
            "jobs": ranked,
            "total": len(ranked),
            "method": "rag_embedding"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding failed: {str(e)}"
        )


@router.post("/fit-score")
def score_job_fit(request: FitScoreRequest):
    """
    Multi-dimensional job fit scoring
    between resume and job description.
    """

    if not request.resume_data:
        raise HTTPException(
            status_code=400,
            detail="resume_data is required"
        )

    if not request.job_data:
        raise HTTPException(
            status_code=400,
            detail="job_data is required"
        )

    # Lazy initialization (important for Render)
    fit_scorer = JobFitScorer()

    try:
        result = fit_scorer.score(
            request.resume_data,
            request.job_data
        )

        return {
            "success": True,
            **result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fit scoring failed: {str(e)}"
        )