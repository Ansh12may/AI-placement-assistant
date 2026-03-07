from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.api import resume
from app.api import jobs
from app.api import interview
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth
from app.routes import saved_jobs, tracker, cover_letter

load_dotenv()

app = FastAPI(
    title="Placeko Resume Analysis API",
    description="Backend service for resume parsing",
    version="1.0.0"
)

# ✅ ADD CORS FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",     # Vite dev server
        "http://127.0.0.1:5173",
        # Add your production domain here when deploying:
        # "https://placeko.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

# ✅ THEN ROUTERS
app.include_router(resume.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(interview.router,prefix="/api")
app.include_router(saved_jobs.router, prefix="/api")
app.include_router(tracker.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")


@app.get("/")
def health_check():
    return {"status": "ok"}