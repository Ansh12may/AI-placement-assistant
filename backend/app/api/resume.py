from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from tempfile import NamedTemporaryFile
import os

from langchain_community.document_loaders import PyPDFLoader

from app.agents.resume_parser import ResumeParser
from app.agents.resume_keyword_extractor import ResumeKeywordExtractor
from app.agents.resume_agent import ResumeAgent
from app.agents.cover_letter_agent import CoverLetterAgent


ACTION_VERBS = [
    "developed", "built", "designed", "implemented", "created", "led",
    "improved", "optimized", "reduced", "increased", "automated", "deployed",
    "integrated", "analyzed", "managed", "delivered", "conducted", "performed",
    "architected", "engineered", "launched", "scaled", "migrated", "streamlined"
]


JOB_KEYWORDS = {
    "machine learning engineer": [
        "python", "tensorflow", "pytorch", "scikit-learn",
        "machine learning", "deep learning", "pandas",
        "numpy", "docker", "aws"
    ],
    "data analyst": [
        "python", "sql", "tableau", "power bi", "excel",
        "pandas", "data analysis", "visualization",
        "statistics", "reporting"
    ],
    "software engineer": [
        "python", "java", "javascript", "git", "docker",
        "aws", "rest api", "sql", "agile", "system design"
    ],
    "frontend developer": [
        "react", "javascript", "html", "css", "typescript",
        "git", "responsive design", "redux", "webpack", "tailwind"
    ],
    "backend developer": [
        "python", "node.js", "java", "sql", "rest api",
        "docker", "aws", "git", "postgresql", "redis"
    ],
    "full stack developer": [
        "react", "node.js", "python", "sql", "docker",
        "git", "rest api", "javascript", "aws", "mongodb"
    ],
    "data scientist": [
        "python", "machine learning", "statistics",
        "pandas", "numpy", "scikit-learn", "sql",
        "visualization", "tensorflow", "r"
    ],
    "devops engineer": [
        "docker", "kubernetes", "aws", "ci/cd",
        "terraform", "linux", "git", "ansible",
        "monitoring", "bash"
    ],
}


def calculate_scores(data: dict) -> dict:
    skills = [s.lower() for s in data.get("skills", [])]
    keywords = [k.lower() for k in data.get("keywords", [])]
    contact = data.get("contact_info", {})
    education = data.get("education", [])
    experience = data.get("experience", [])
    projects = data.get("projects", [])
    job_title = data.get("job_title", "").lower()

    ats_checks = [
        bool(contact.get("email")),
        bool(contact.get("phone")),
        len(skills) >= 5,
        len(education) > 0,
        len(projects) > 0 or len(experience) > 0,
        len(skills) <= 20,
    ]

    ats_score = round(sum(ats_checks) / len(ats_checks) * 100)

    expected = JOB_KEYWORDS.get(job_title, [])

    if expected:
        matched = sum(
            1 for kw in expected
            if kw in skills or kw in keywords
        )
        keyword_score = round(
            matched / len(expected) * 100
        )
    else:
        keyword_score = min(
            100,
            round(len(keywords) / 10 * 100)
        )

    format_checks = [
        bool(contact.get("email")),
        bool(contact.get("phone")),
        len(education) > 0,
        len(skills) > 0,
        len(projects) > 0 or len(experience) > 0,
        len(experience) > 0,
    ]

    formatting_score = round(
        sum(format_checks) / len(format_checks) * 100
    )

    all_text = " ".join(
        [
            p.get("description", "").lower()
            for p in projects
        ] +
        [
            e if isinstance(e, str)
            else e.get("description", "")
            for e in experience
        ]
    )

    verb_count = sum(
        1 for verb in ACTION_VERBS
        if verb in all_text
    )

    impact_score = min(
        100,
        round(verb_count / 8 * 100)
    )

    overall = round(
        (
            ats_score +
            keyword_score +
            formatting_score +
            impact_score
        ) / 4
    )

    return {
        "ats_score": ats_score,
        "keyword_score": keyword_score,
        "formatting_score": formatting_score,
        "impact_score": impact_score,
        "overall_score": overall,
    }


router = APIRouter(
    prefix="/resume",
    tags=["Resume Analysis"]
)

MAX_FILE_SIZE = 5 * 1024 * 1024


class CoverLetterRequest(BaseModel):
    resume_data: dict
    job_title: str
    company: str
    job_description: str
    tone: str = "professional"


@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    safe_name = os.path.basename(
        file.filename
    ).lower()

    if not safe_name.endswith((".txt", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Only .txt or .pdf files are supported"
        )

    raw_bytes = await file.read()

    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 5MB)"
        )

    if safe_name.endswith(".pdf"):
        tmp_path = None

        try:
            with NamedTemporaryFile(
                delete=False,
                suffix=".pdf"
            ) as tmp:
                tmp.write(raw_bytes)
                tmp_path = tmp.name

            loader = PyPDFLoader(tmp_path)
            pages = loader.load()

            text = "\n".join(
                page.page_content
                for page in pages
            )

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"PDF extraction failed: {str(e)}"
            )

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    else:
        text = raw_bytes.decode(
            "utf-8",
            errors="ignore"
        )

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Uploaded file contains no readable text"
        )

    # Lazy initialization (important for Render)
    parser = ResumeParser()
    extractor = ResumeKeywordExtractor()
    agent = ResumeAgent()

    parsed = parser.parse_resume(text)

    if not parsed:
        raise HTTPException(
            status_code=422,
            detail="Resume parsing failed"
        )

    keywords = extractor.extract_keywords(parsed)
    job_title = extractor.extract_job_title(parsed)
    ai_feedback = agent.analyze_resume(parsed)

    resume_data = {
        "contact_info": parsed.get("contact_info", {}),
        "skills": parsed.get("skills", []),
        "education": parsed.get("education", []),
        "experience": parsed.get("experience", []),
        "projects": parsed.get("projects", []),
        "keywords": keywords,
        "job_title": job_title,
    }

    scores = calculate_scores(resume_data)

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
    if not request.job_title or not request.company:
        raise HTTPException(
            status_code=400,
            detail="job_title and company are required"
        )

    if (
        not request.job_description
        or len(request.job_description.strip()) < 20
    ):
        raise HTTPException(
            status_code=400,
            detail="A meaningful job_description is required"
        )

    valid_tones = {
        "professional",
        "enthusiastic",
        "concise"
    }

    if request.tone not in valid_tones:
        raise HTTPException(
            status_code=400,
            detail=(
                f"tone must be one of: "
                f"{', '.join(valid_tones)}"
            )
        )

    # Lazy initialization (important for Render)
    cover_letter_agent = CoverLetterAgent()

    try:
        result = cover_letter_agent.generate(
            job_title=request.job_title,
            company=request.company,
            job_description=request.job_description,
            user_name=request.resume_data.get("name"),
            skills=request.resume_data.get("skills", []),
            tone=request.tone
        )

        return {
            "success": True,
            "cover_letter": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cover letter generation failed: {str(e)}"
        )