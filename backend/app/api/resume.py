from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from tempfile import NamedTemporaryFile
import os

from langchain_community.document_loaders import PyPDFLoader

from app.agents.resume_parser import ResumeParser
from app.agents.resume_keyword_extractor import ResumeKeywordExtractor
from app.agents.resume_agent import ResumeAgent
from app.agents.cover_letter_agent import CoverLetterAgent

# Add this to your app/routes/resume.py
# Call calculate_scores(data) before returning the response
# and add "scores" to the returned data dict

ACTION_VERBS = [
    "developed", "built", "designed", "implemented", "created", "led",
    "improved", "optimized", "reduced", "increased", "automated", "deployed",
    "integrated", "analyzed", "managed", "delivered", "conducted", "performed",
    "architected", "engineered", "launched", "scaled", "migrated", "streamlined"
]

# Keywords expected per job title — expand as needed
JOB_KEYWORDS = {
    "machine learning engineer": ["python", "tensorflow", "pytorch", "scikit-learn", "machine learning", "deep learning", "pandas", "numpy", "docker", "aws"],
    "data analyst":              ["python", "sql", "tableau", "power bi", "excel", "pandas", "data analysis", "visualization", "statistics", "reporting"],
    "software engineer":         ["python", "java", "javascript", "git", "docker", "aws", "rest api", "sql", "agile", "system design"],
    "frontend developer":        ["react", "javascript", "html", "css", "typescript", "git", "responsive design", "redux", "webpack", "tailwind"],
    "backend developer":         ["python", "node.js", "java", "sql", "rest api", "docker", "aws", "git", "postgresql", "redis"],
    "full stack developer":      ["react", "node.js", "python", "sql", "docker", "git", "rest api", "javascript", "aws", "mongodb"],
    "data scientist":            ["python", "machine learning", "statistics", "pandas", "numpy", "scikit-learn", "sql", "visualization", "tensorflow", "r"],
    "devops engineer":           ["docker", "kubernetes", "aws", "ci/cd", "terraform", "linux", "git", "ansible", "monitoring", "bash"],
}

def calculate_scores(data: dict) -> dict:
    skills     = [s.lower() for s in data.get("skills", [])]
    keywords   = [k.lower() for k in data.get("keywords", [])]
    contact    = data.get("contact_info", {})
    education  = data.get("education", [])
    experience = data.get("experience", [])
    projects   = data.get("projects", [])
    job_title  = data.get("job_title", "").lower()

    # ── 1. ATS Compatibility ─────────────────────────────────────────────────
    # Based on whether key resume sections are present
    ats_checks = [
        bool(contact.get("email")),       # has email
        bool(contact.get("phone")),       # has phone
        len(skills) >= 5,                 # enough skills
        len(education) > 0,               # has education
        len(projects) > 0 or len(experience) > 0,  # has projects or experience
        len(skills) <= 20,                # not too many skills (ATS can choke)
    ]
    ats_score = round(sum(ats_checks) / len(ats_checks) * 100)

    # ── 2. Keyword Match ──────────────────────────────────────────────────────
    # Compare resume keywords/skills against expected keywords for the job title
    expected = JOB_KEYWORDS.get(job_title, [])
    if expected:
        matched = sum(1 for kw in expected if kw in skills or kw in keywords)
        keyword_score = round(matched / len(expected) * 100)
    else:
        # No known job title — score based on keyword density
        keyword_score = min(100, round(len(keywords) / 10 * 100))

    # ── 3. Formatting ─────────────────────────────────────────────────────────
    # Based on completeness of resume sections
    format_checks = [
        bool(contact.get("email")),
        bool(contact.get("phone")),
        len(education) > 0,
        len(skills) > 0,
        len(projects) > 0 or len(experience) > 0,
        len(experience) > 0,              # bonus: has work experience
    ]
    formatting_score = round(sum(format_checks) / len(format_checks) * 100)

    # ── 4. Impact Language ────────────────────────────────────────────────────
    # Count action verbs across all project/experience descriptions
    all_text = " ".join([
        p.get("description", "").lower() for p in projects
    ] + [
        e if isinstance(e, str) else e.get("description", "") for e in experience
    ])
    verb_count  = sum(1 for verb in ACTION_VERBS if verb in all_text)
    impact_score = min(100, round(verb_count / 8 * 100))  # 8 verbs = 100%

    # ── Overall Score ─────────────────────────────────────────────────────────
    overall = round((ats_score + keyword_score + formatting_score + impact_score) / 4)

    return {
        "ats_score":        ats_score,
        "keyword_score":    keyword_score,
        "formatting_score": formatting_score,
        "impact_score":     impact_score,
        "overall_score":    overall,
    }
























router = APIRouter(prefix="/resume", tags=["Resume Analysis"])

parser = ResumeParser()
extractor = ResumeKeywordExtractor()
agent = ResumeAgent()
cover_letter_agent = CoverLetterAgent()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class CoverLetterRequest(BaseModel):
    resume_data: dict
    job_title: str
    company: str
    job_description: str
    tone: str = "professional"  # professional | enthusiastic | concise


@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    """Upload a resume and receive structured analysis."""

    # -----------------------------
    # VALIDATION
    # -----------------------------
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Sanitize filename to prevent path traversal
    safe_name = os.path.basename(file.filename).lower()

    if not safe_name.endswith((".txt", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Only .txt or .pdf files are supported"
        )

    # -----------------------------
    # READ FILE
    # -----------------------------
    raw_bytes = await file.read()

    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 5MB)"
        )

    # -----------------------------
    # PDF PARSING
    # FIX: Use try/finally to ensure temp file is always cleaned up,
    # even if PyPDFLoader raises an exception mid-extraction.
    # -----------------------------
    if safe_name.endswith(".pdf"):
        tmp_path = None
        try:
            with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(raw_bytes)
                tmp_path = tmp.name

            loader = PyPDFLoader(tmp_path)
            pages = loader.load()
            text = "\n".join(page.page_content for page in pages)

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"PDF extraction failed: {str(e)}"
            )
        finally:
            # Always remove temp file regardless of success or failure
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    # -----------------------------
    # TXT FILE
    # -----------------------------
    else:
        text = raw_bytes.decode("utf-8", errors="ignore")

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Uploaded file contains no readable text"
        )

    # -----------------------------
    # PARSE RESUME
    # -----------------------------
    parsed = parser.parse_resume(text)

    if not parsed:
        raise HTTPException(
            status_code=422,
            detail="Resume parsing failed"
        )

    # -----------------------------
    # KEYWORDS + JOB TITLE
    # -----------------------------
    keywords = extractor.extract_keywords(parsed)
    job_title = extractor.extract_job_title(parsed)

    # -----------------------------
    # AI ANALYSIS
    # -----------------------------
    ai_feedback = agent.analyze_resume(parsed)

    # -----------------------------
    # SCORES
    # -----------------------------
    resume_data = {
        "contact_info": parsed.get("contact_info", {}),
        "skills":       parsed.get("skills", []),
        "education":    parsed.get("education", []),
        "experience":   parsed.get("experience", []),
        "projects":     parsed.get("projects", []),
        "keywords":     keywords,
        "job_title":    job_title,
    }
    scores = calculate_scores(resume_data)

    # -----------------------------
    # RESPONSE
    # -----------------------------
    return {
        "success": True,
        "data": {
            **resume_data,
            "ai_feedback": ai_feedback,
            "scores": scores,
        }
    }


@router.post("/cover-letter")
def generate_cover_letter(request: CoverLetterRequest):
    """
    Generate a tailored cover letter from resume data and job description.

    Tone options: professional | enthusiastic | concise
    """
    if not request.job_title or not request.company:
        raise HTTPException(status_code=400, detail="job_title and company are required")

    if not request.job_description or len(request.job_description.strip()) < 20:
        raise HTTPException(status_code=400, detail="A meaningful job_description is required")

    valid_tones = {"professional", "enthusiastic", "concise"}
    if request.tone not in valid_tones:
        raise HTTPException(status_code=400, detail=f"tone must be one of: {', '.join(valid_tones)}")

    try:
        result = cover_letter_agent.generate(
            resume_data=request.resume_data,
            job_title=request.job_title,
            company=request.company,
            job_description=request.job_description,
            tone=request.tone
        )
        return {"success": True, **result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")