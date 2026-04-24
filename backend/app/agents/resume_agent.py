import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


class ResumeAgent:
    """
    LLM-powered agent that analyzes resumes and provides
    structured, actionable improvement feedback.
    """

    def __init__(self):

        self.llm_available = bool(OPENAI_API_KEY)

        if self.llm_available:
            try:
                self.llm = ChatOpenAI(
                    model=LLM_MODEL,
                    temperature=0.4
                )
            except Exception as e:
                print(f"[WARN] LLM initialization failed: {e}")
                self.llm_available = False

    # PUBLIC API
    
    def analyze_resume(self, resume_data: dict):

        if not resume_data:
            return self._basic_analysis(resume_data)

        if not self.llm_available:
            return self._basic_analysis(resume_data)

        try:

            messages = self._build_messages(resume_data)

            response = self.llm.invoke(messages)

            return response.content.strip()

        except Exception as e:

            print(f"[WARN] Resume analysis failed: {e}")

            return self._basic_analysis(resume_data)

    
    # BUILD CHAT MESSAGES
    def _build_messages(self, resume_data):

        skills = resume_data.get("skills", [])
        education = resume_data.get("education", [])
        experience = resume_data.get("experience", [])
        projects = resume_data.get("projects", [])

        skill_groups = self._group_skills(skills)

        system_message = """
You are an expert technical recruiter and ATS optimization specialist.

Your job is to analyze resumes and give clear, concise, and actionable
improvements that increase the candidate's chances of passing ATS filters
and impressing hiring managers.

Focus on:

• clarity
• quantifiable impact
• keyword optimization
• role alignment
"""

        user_message = f"""
=====================
RESUME DATA
=====================

SKILLS:
{", ".join(skills) if skills else "Not specified"}

SKILL GROUPING:
Languages: {", ".join(skill_groups["languages"])}
Frameworks: {", ".join(skill_groups["frameworks"])}
Databases: {", ".join(skill_groups["databases"])}
Tools: {", ".join(skill_groups["tools"])}

EDUCATION:
{chr(10).join("- " + e for e in education) if education else "Not specified"}

EXPERIENCE:
{chr(10).join("- " + e for e in experience) if experience else "Not specified"}

PROJECTS:
{chr(10).join("- " + p.get("description","") for p in projects) if projects else "Not specified"}

=====================
OUTPUT FORMAT
=====================

OVERALL ASSESSMENT:
(2–3 lines summarizing competitiveness)

STRENGTHS:
• Bullet points

GAPS / WEAKNESSES:
• Bullet points

CONTENT IMPROVEMENTS:
• Improve experience bullets
• Improve project descriptions

SKILLS OPTIMIZATION:
• Skill grouping
• Missing industry skills

ATS OPTIMIZATION:
• Keyword usage
• Formatting suggestions

ROLE TARGETING:
• Best-suited job roles
• One-line reasoning
"""

        return [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]

    # --------------------------------------------------
    # SKILL GROUPING
    # --------------------------------------------------
    def _group_skills(self, skills):

        languages = []
        frameworks = []
        databases = []
        tools = []

        for s in skills:

            s_lower = s.lower()

            if s_lower in ["python","java","c++","javascript","typescript","go","rust"]:
                languages.append(s)

            elif s_lower in ["react","node.js","django","flask","fastapi","angular","vue"]:
                frameworks.append(s)

            elif s_lower in ["mongodb","mysql","postgresql","redis","sqlite"]:
                databases.append(s)

            else:
                tools.append(s)

        return {
            "languages": languages,
            "frameworks": frameworks,
            "databases": databases,
            "tools": tools
        }

    # --------------------------------------------------
    # FALLBACK ANALYSIS (NO LLM)
    # --------------------------------------------------
    def _basic_analysis(self, resume_data):

        skills = resume_data.get("skills", [])
        education = resume_data.get("education", [])
        experience = resume_data.get("experience", [])

        strengths = []
        gaps = []

        if len(skills) >= 6:
            strengths.append("Good breadth of technical skills")
        else:
            gaps.append("Technical skills section is limited or not well categorized")

        if len(experience) >= 2:
            strengths.append("Multiple experience entries provide credibility")
        else:
            gaps.append("Work experience section needs more detail or projects")

        if any("python" in s.lower() for s in skills):
            strengths.append("Python is a strong, in-demand skill")
        else:
            gaps.append("Python is not listed and is highly recommended")

        analysis = f"""
OVERALL ASSESSMENT:
This resume shows foundational technical skills but can be improved to
better compete in the current job market.

STRENGTHS:
{chr(10).join("• " + s for s in strengths) if strengths else "• Some relevant skills detected"}

GAPS / WEAKNESSES:
{chr(10).join("• " + g for g in gaps) if gaps else "• No major gaps detected"}

CONTENT IMPROVEMENTS:
• Add quantified achievements (performance improvements, metrics)
• Expand project descriptions
• Focus on outcomes instead of tasks

SKILLS OPTIMIZATION:
• Group skills into Languages / Frameworks / Tools
• Highlight the most relevant technologies first

ATS OPTIMIZATION:
• Include keywords from job descriptions
• Avoid complex formatting and tables

ROLE TARGETING:
• Software Engineer
• Backend Developer
• Full Stack Developer
"""

        return analysis.strip()