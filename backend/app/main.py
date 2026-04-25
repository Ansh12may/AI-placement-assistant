from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.api import resume
from app.api import jobs
from app.api import interview
from app.routes import auth
from app.routes import saved_jobs, tracker, cover_letter

load_dotenv()

app = FastAPI(
    title="Placeko Resume Analysis API",
    description="Backend service for resume parsing",
    version="1.0.0"
)

# CORS (perfect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://your-frontend-domain.com",  # Add later
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All your routers (perfect)
app.include_router(auth.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(saved_jobs.router, prefix="/api")
app.include_router(tracker.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

# 🚀 RENDER PORT BINDING (CRITICAL)
if __name__ == "__main__":
    import uvicorn
    import os
    
    # Render sets PORT env var
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")  # Render needs 0.0.0.0
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
        reload=os.getenv("ENV") == "development"
    )