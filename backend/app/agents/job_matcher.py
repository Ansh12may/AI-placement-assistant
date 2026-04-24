import os
import json
from langchain_openai import ChatOpenAI
from pydantic import BaseModel
from typing import List

class JobSearchRequest(BaseModel):
    keywords: str
    location: str = "India"
    skills:   List[str] = []
    count:    int = 5

from app.agents.job_scraper import JobScraper
from app.agents.serp_api_searcher import SerpApiSearcher


class JobSearchAgent:
    """Agent for job discovery and resume–job matching."""

    def __init__(self):
        self.job_scraper         = JobScraper()
        self.serp_api_searcher   = SerpApiSearcher()
        self.openai_api_key      = os.getenv("OPENAI_API_KEY")
        self.model               = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.job_platforms       = ["Indeed", "LinkedIn", "Glassdoor", "ZipRecruiter", "Monster"]
        self.llm_enabled         = bool(self.openai_api_key)

        if self.llm_enabled:
            self.llm = ChatOpenAI(model=self.model, temperature=0.4)

    # --------------------------------------------------
    # JOB SEARCH  ← fixed: now extracts + passes skills
    # --------------------------------------------------
    def search_jobs(self, resume_data, keywords, location, platforms=None, count=5):
        if not platforms:
            platforms = self.job_platforms

        # Extract skills from resume to improve search query
        skills = resume_data.get("skills", []) if resume_data else []

        #  Try SerpAPI (real jobs)
        jobs = []
        for platform in platforms:
            jobs.extend(
                self.serp_api_searcher.search_jobs(
                    keywords, location,
                    platform=platform,
                    count=count,
                    skills=skills,      # ← FIXED
                )
            )
        if jobs:
            return jobs

        # 2️⃣ Fallback to fake job scraper
        for platform in platforms:
            jobs.extend(
                self.job_scraper.search_jobs(
                    keywords, location,
                    platform=platform,
                    count=count,
                )
            )
        return jobs

    # --------------------------------------------------
    # JOB MATCH ANALYSIS (LLM-based)
    # --------------------------------------------------
    def get_job_match_analysis(self, resume_data, job_data):
        if not self.llm_enabled:
            return self._basic_match_analysis(resume_data, job_data)

        skills      = resume_data.get("skills", [])
        experience  = resume_data.get("experience", [])
        job_title   = job_data.get("title", "")
        job_description = job_data.get("description", "")

        prompt = f"""
You are an ATS and hiring expert.
Compare the RESUME with the JOB and return ONLY valid JSON.

RESUME SKILLS: {", ".join(skills)}
RESUME EXPERIENCE: {chr(10).join(experience)}
JOB TITLE: {job_title}
JOB DESCRIPTION: {job_description}

Return JSON ONLY:
{{
  "match_score": 0-100,
  "key_matches": [],
  "gaps": [],
  "recommendations": []
}}
"""
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print("LLM job match failed:", e)
            return self._basic_match_analysis(resume_data, job_data)

    # --------------------------------------------------
    # BASIC MATCH (fallback, no AI)
    # --------------------------------------------------
    def _basic_match_analysis(self, resume_data, job_data):
        skills          = resume_data.get("skills", [])
        job_description = job_data.get("description", "").lower()
        matches         = [s for s in skills if s.lower() in job_description]
        score           = min(len(matches) * 12, 100) if matches else 50

        return {
            "match_score":    score,
            "key_matches":    matches[:5],
            "gaps":           ["AI-based analysis not available"],
            "recommendations": [
                "Tailor resume to job requirements",
                "Highlight relevant skills clearly",
                "Add measurable impact to experience"
            ]
        }
    








