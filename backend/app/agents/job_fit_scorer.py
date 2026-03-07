import os
import re
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


class JobFitScorer:
    """
    Multi-dimensional job fit scorer.

    Goes beyond simple keyword overlap by scoring across five dimensions:
    skills match, experience level alignment, education fit, project
    relevance, and culture/soft skills signals.

    Usage:
        scorer = JobFitScorer()
        result = scorer.score(resume_data, job_data)
    """

    WEIGHTS = {
        "skills_match":       0.35,
        "experience_level":   0.25,
        "education_fit":      0.15,
        "project_relevance":  0.15,
        "culture_fit":        0.10,
    }

    GRADE_THRESHOLDS = [
        (95, "A+"), (90, "A"), (85, "A-"),
        (80, "B+"), (75, "B"), (70, "B-"),
        (65, "C+"), (60, "C"), (0,  "D"),
    ]

    SENIORITY_KEYWORDS = {
        "junior":   ["junior", "entry level", "0-2 years", "graduate", "intern", "fresher"],
        "mid":      ["mid", "2-5 years", "3 years", "4 years", "intermediate"],
        "senior":   ["senior", "5+ years", "lead", "staff", "principal", "architect"],
        "manager":  ["manager", "director", "head of", "vp", "vice president"],
    }

    CULTURE_KEYWORDS = [
        "agile", "scrum", "kanban", "collaboration", "teamwork",
        "communication", "cross-functional", "ownership", "fast-paced",
        "startup", "mentoring", "code review", "pair programming"
    ]

    def __init__(self):
        self.llm_enabled = bool(OPENAI_API_KEY)
        if self.llm_enabled:
            self.client = OpenAI(api_key=OPENAI_API_KEY)
            self.model = LLM_MODEL

    # --------------------------------------------------
    # PUBLIC API
    # --------------------------------------------------
    def score(self, resume_data: dict, job_data: dict) -> dict:
        """
        Compute a multi-factor fit score.

        Returns:
            {
                "overall_score": int (0-100),
                "grade": str,
                "breakdown": { dimension: score },
                "top_matches": list[str],
                "critical_gaps": list[str],
                "recommendation": str
            }
        """
        breakdown = {
            "skills_match":      self._score_skills(resume_data, job_data),
            "experience_level":  self._score_experience(resume_data, job_data),
            "education_fit":     self._score_education(resume_data, job_data),
            "project_relevance": self._score_projects(resume_data, job_data),
            "culture_fit":       self._score_culture(resume_data, job_data),
        }

        overall = int(sum(
            breakdown[dim] * weight
            for dim, weight in self.WEIGHTS.items()
        ))

        grade = next(g for threshold, g in self.GRADE_THRESHOLDS if overall >= threshold)

        skills = resume_data.get("skills", [])
        jd_lower = job_data.get("description", "").lower()
        top_matches = [s for s in skills if s.lower() in jd_lower][:5]

        critical_gaps = self._identify_gaps(resume_data, job_data)

        recommendation = self._build_recommendation(overall, critical_gaps)

        return {
            "overall_score": overall,
            "grade": grade,
            "breakdown": breakdown,
            "top_matches": top_matches,
            "critical_gaps": critical_gaps,
            "recommendation": recommendation
        }

    # --------------------------------------------------
    # DIMENSION SCORERS
    # --------------------------------------------------
    def _score_skills(self, resume_data: dict, job_data: dict) -> int:
        """Skills keyword overlap between resume and job description."""
        skills = [s.lower() for s in resume_data.get("skills", [])]
        jd = job_data.get("description", "").lower() + " " + job_data.get("requirements", "").lower()

        if not skills:
            return 30

        matches = sum(1 for s in skills if re.search(rf"\b{re.escape(s)}\b", jd))
        ratio = matches / len(skills)

        # Bonus for high absolute match count
        bonus = min(10, matches * 2)
        return min(100, int(ratio * 80) + bonus)

    def _score_experience(self, resume_data: dict, job_data: dict) -> int:
        """Check if candidate seniority level aligns with job requirements."""
        exp_text = " ".join(resume_data.get("experience", [])).lower()
        jd_lower = job_data.get("description", "").lower()

        candidate_level = "mid"
        for level, keywords in self.SENIORITY_KEYWORDS.items():
            if any(kw in exp_text for kw in keywords):
                candidate_level = level
                break

        required_level = "mid"
        for level, keywords in self.SENIORITY_KEYWORDS.items():
            if any(kw in jd_lower for kw in keywords):
                required_level = level
                break

        level_order = ["junior", "mid", "senior", "manager"]
        c_idx = level_order.index(candidate_level)
        r_idx = level_order.index(required_level)

        diff = abs(c_idx - r_idx)
        scores = {0: 90, 1: 65, 2: 40, 3: 20}
        return scores.get(diff, 20)

    def _score_education(self, resume_data: dict, job_data: dict) -> int:
        """Degree level detection vs. job education requirements."""
        edu_text = " ".join(resume_data.get("education", [])).lower()
        jd_lower = job_data.get("description", "").lower()

        has_masters = any(k in edu_text for k in ["master", "m.tech", "mba", "m.s", "ms "])
        has_bachelors = any(k in edu_text for k in ["bachelor", "b.tech", "b.e", "b.s", "bsc"])
        requires_masters = any(k in jd_lower for k in ["master's", "masters", "m.tech", "mba required"])

        if requires_masters:
            return 95 if has_masters else 60

        # Bachelor's is baseline expectation for most tech roles
        if has_masters:
            return 100
        if has_bachelors:
            return 85
        return 55  # No detectable degree

    def _score_projects(self, resume_data: dict, job_data: dict) -> int:
        """How well project tech stacks match the job's tech requirements."""
        projects = resume_data.get("projects", [])
        jd_lower = job_data.get("description", "").lower()

        if not projects:
            return 40

        all_project_tech = []
        for p in projects:
            all_project_tech.extend([t.lower() for t in p.get("tech_stack", [])])

        if not all_project_tech:
            return 40

        matches = sum(1 for t in all_project_tech if re.search(rf"\b{re.escape(t)}\b", jd_lower))
        ratio = matches / len(all_project_tech)
        return min(100, int(ratio * 90) + 10)

    def _score_culture(self, resume_data: dict, job_data: dict) -> int:
        """Soft skill and culture signal detection."""
        exp_text = " ".join(resume_data.get("experience", [])).lower()
        jd_lower = job_data.get("description", "").lower()

        exp_signals = sum(1 for kw in self.CULTURE_KEYWORDS if kw in exp_text)
        jd_signals = sum(1 for kw in self.CULTURE_KEYWORDS if kw in jd_lower)

        if jd_signals == 0:
            return 70  # Job doesn't signal culture requirements strongly

        overlap = min(exp_signals, jd_signals)
        return min(100, int((overlap / jd_signals) * 80) + 20)

    # --------------------------------------------------
    # GAPS & RECOMMENDATION
    # --------------------------------------------------
    def _identify_gaps(self, resume_data: dict, job_data: dict) -> list:
        """Extract keywords from JD that are not in resume skills."""
        resume_skills = set(s.lower() for s in resume_data.get("skills", []))
        jd = (job_data.get("description", "") + " " + job_data.get("requirements", "")).lower()

        # Common tech terms to look for in JD
        tech_terms = [
            "kubernetes", "docker", "aws", "azure", "gcp", "terraform",
            "kafka", "elasticsearch", "redis", "postgresql", "mongodb",
            "react", "typescript", "python", "java", "go", "rust",
            "machine learning", "deep learning", "spark", "airflow",
            "ci/cd", "graphql", "microservices", "rest api"
        ]

        gaps = [
            term for term in tech_terms
            if re.search(rf"\b{re.escape(term)}\b", jd) and term not in resume_skills
        ]

        return gaps[:5]

    def _build_recommendation(self, score: int, gaps: list) -> str:
        gap_text = f" Address these gaps before applying: {', '.join(gaps[:3])}." if gaps else ""

        if score >= 85:
            return f"Excellent fit — strong candidate for this role.{gap_text}"
        if score >= 70:
            return f"Good fit — competitive candidate with room to improve.{gap_text}"
        if score >= 55:
            return f"Moderate fit — consider upskilling before applying.{gap_text}"
        return f"Weak fit — significant gaps exist between your profile and this role.{gap_text}"
