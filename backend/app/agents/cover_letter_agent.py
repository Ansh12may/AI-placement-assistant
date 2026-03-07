import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


class CoverLetterAgent:
    """
    AI-powered cover letter generator.

    Generates a job-tailored cover letter by combining parsed resume data
    with the target job description. Mirrors ATS keywords from the job
    posting and adapts tone based on user preference.

    Usage:
        agent = CoverLetterAgent()
        result = agent.generate(
            resume_data=parsed_resume,
            job_title="Senior Backend Engineer",
            company="Stripe",
            job_description="We are looking for...",
            tone="professional"
        )
    """

    TONE_INSTRUCTIONS = {
        "professional": "formal, confident, and results-focused",
        "enthusiastic": "warm, energetic, and genuinely excited about the role",
        "concise":      "brief and direct — maximum 200 words, no filler",
    }

    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.model = LLM_MODEL

    def generate(
        self,
        resume_data: dict,
        job_title: str,
        company: str,
        job_description: str,
        tone: str = "professional"
    ) -> dict:
        """
        Generate a tailored cover letter.

        Args:
            resume_data:      Parsed resume dict (output of ResumeParser)
            job_title:        Target job title
            company:          Target company name
            job_description:  Full job description text
            tone:             One of 'professional', 'enthusiastic', 'concise'

        Returns:
            {
                "cover_letter": str,
                "word_count": int,
                "keywords_used": list[str]
            }
        """
        tone_style = self.TONE_INSTRUCTIONS.get(tone, self.TONE_INSTRUCTIONS["professional"])

        skills = resume_data.get("skills", [])[:10]
        experience = resume_data.get("experience", [])
        projects = resume_data.get("projects", [])

        top_project = ""
        if projects:
            top_project = projects[0].get("name", "")
            top_tech = ", ".join(projects[0].get("tech_stack", [])[:4])
            if top_tech:
                top_project = f"{top_project} ({top_tech})"

        recent_experience = experience[0][:300] if experience else "various software projects"

        jd_lower = job_description.lower()
        keywords_used = [s for s in skills if s.lower() in jd_lower]

        prompt = f"""
You are an expert career coach writing a cover letter.

Write a cover letter that is {tone_style}.

CANDIDATE INFO:
- Top Skills: {", ".join(skills)}
- Notable Project: {top_project}
- Recent Experience Summary: {recent_experience}

TARGET ROLE:
- Job Title: {job_title}
- Company: {company}
- Job Description: {job_description[:800]}

REQUIREMENTS:
1. Address the letter to "Dear Hiring Manager,"
2. Opening paragraph: Express interest and state the role name
3. Middle paragraphs: Connect candidate's skills/projects to the job requirements
4. Closing paragraph: Request an interview and thank them
5. Sign off with "Sincerely,"
6. Naturally include these keywords where relevant: {", ".join(keywords_used[:6])}
7. Do NOT make up experience or facts not provided above
8. Output the letter text ONLY — no preamble or commentary
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=700
        )

        letter_text = response.choices[0].message.content.strip()
        word_count = len(letter_text.split())

        # Detect which keywords actually appear in the final letter
        letter_lower = letter_text.lower()
        confirmed_keywords = [kw for kw in skills if kw.lower() in letter_lower]

        return {
            "cover_letter": letter_text,
            "word_count": word_count,
            "keywords_used": confirmed_keywords
        }
