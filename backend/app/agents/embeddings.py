# app/agents/embeddings.py
# Handles resume and job description embeddings using OpenAI
# pip install openai numpy

import os
import numpy as np
from openai import OpenAI

EMBED_MODEL = "text-embedding-3-small" 


def get_openai_client():
    """
    Create OpenAI client only when needed.
    Prevents Render deployment issues caused by
    import-time initialization.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing")

    return OpenAI(api_key=api_key)



def get_embedding(text: str) -> list[float]:
    """Convert text to embedding vector using OpenAI."""
    text = text.strip().replace("\n", " ")
    client = get_openai_client()
    response = client.embeddings.create(
        model=EMBED_MODEL,
        input=text,
    )
    return response.data[0].embedding


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two vectors. Returns 0-1."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def build_resume_text(resume_data: dict) -> str:
    """
    Convert structured resume data into a clean text
    representation for embedding.
    """
    parts = []

    job_title = resume_data.get("job_title", "")
    if job_title:
        parts.append(f"Target Role: {job_title}")

    skills = resume_data.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")

    keywords = resume_data.get("keywords", [])
    if keywords:
        parts.append(f"Keywords: {', '.join(keywords)}")

    for proj in resume_data.get("projects", []):
        if isinstance(proj, dict):
            name = proj.get("name", "")
            desc = proj.get("description", "")
            tech = ", ".join(proj.get("tech_stack", []))
            parts.append(f"Project: {name}. Tech: {tech}. {desc}")

    for exp in resume_data.get("experience", []):
        if isinstance(exp, str):
            parts.append(f"Experience: {exp}")
        elif isinstance(exp, dict):
            parts.append(f"Experience: {exp.get('description', '')}")

    return "\n".join(parts)


def build_job_text(job: dict) -> str:
    """
    Convert a job listing into text for embedding.
    """
    parts = []
    if job.get("title"):
        parts.append(f"Job Title: {job['title']}")
    if job.get("company"):
        parts.append(f"Company: {job['company']}")
    if job.get("description"):
        parts.append(f"Description: {job['description']}")
    if job.get("skills"):
        parts.append(f"Required Skills: {', '.join(job['skills'])}")
    if job.get("location"):
        parts.append(f"Location: {job['location']}")
    return "\n".join(parts)


def rank_jobs_by_similarity(
    resume_data: dict,
    jobs: list[dict],
    top_n: int = 9,
) -> list[dict]:
    """
    Rank jobs by semantic similarity to resume.
    Adds a 'match_score' (0-100) to each job.
    Returns top_n jobs sorted by match score.
    """
    # Build and embed resume
    resume_text   = build_resume_text(resume_data)
    resume_vector = get_embedding(resume_text)

    results = []
    for job in jobs:
        job_text   = build_job_text(job)
        job_vector = get_embedding(job_text)

        similarity   = cosine_similarity(resume_vector, job_vector)
        match_score  = round(similarity * 100, 1)  # convert to 0-100

        results.append({**job, "match_score": match_score})

    # Sort by match score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:top_n]