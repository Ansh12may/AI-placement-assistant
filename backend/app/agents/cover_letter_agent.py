import os
import google.generativeai as genai
from typing import Dict, List

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class CoverLetterAgent:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def generate(self, job_title: str, company: str, job_description: str, 
                 user_name: str | None = None, skills: List[str] = [], 
                 tone: str = "professional") -> str:
        """ EXACT route signature match."""
        
        candidate = user_name or "candidate"
        skills_str = ", ".join(skills) if skills else "strong technical skills"
        
        prompt = f"""Write a {tone} cover letter for:

POSITION: {job_title}
COMPANY: {company}
CANDIDATE: {candidate}
KEY SKILLS: {skills_str}

JOB DESCRIPTION: {job_description[:800]}...

REQUIREMENTS:
• 3-4 paragraphs (250-350 words)
• ATS keywords from JD naturally
• Quantified achievements
• Confident, enthusiastic tone
• Perfect grammar/formatting

Return ONLY the cover letter text (no markdown)."""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Generation error (check API key): {str(e)}"