import os
import re
import json
from dotenv import load_dotenv
from openai import OpenAI

# load_dotenv()

# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


class InterviewAgent:

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise ValueError("OPENAI_API_KEY is missing")

        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    # --------------------------------------------------
    # INTERNAL: Safe JSON parser
    # FIX: OpenAI sometimes wraps responses in ```json fences,
    # causing json.loads() to crash with JSONDecodeError.
    # --------------------------------------------------
    def _parse_json(self, content: str):
        """Strip markdown fences and parse JSON safely."""
        clean = re.sub(r"```json|```", "", content).strip()
        return json.loads(clean)

    # -----------------------------
    # GENERAL QUESTION GENERATION
    # -----------------------------
    def generate_questions(self, job_data: dict, resume_data: dict = None, count: int = 5):
        """Generate mixed interview questions for a role."""
        job_title = job_data.get("title", "")
        description = job_data.get("description", "")
        skills = resume_data.get("skills", []) if resume_data else []

        prompt = f"""
Generate {count} interview questions.

Role: {job_title}

Job Description:
{description}

Candidate Skills:
{", ".join(skills)}

Include a mix of:
- technical
- behavioral
- problem solving

Return ONLY a valid JSON array (no markdown fences):

[
  {{"question": "", "type": "technical"}}
]
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        try:
            questions = self._parse_json(response.choices[0].message.content)
            # Deduplicate if large batch
            seen = set()
            unique = []
            for q in questions:
                text = q.get("question", "")
                if text not in seen:
                    seen.add(text)
                    unique.append(q)
            return unique
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[WARN] Question parse failed: {e}")
            return [{"question": "Tell me about yourself.", "type": "behavioral"}]

    # -----------------------------
    # CODING QUESTIONS
    # -----------------------------
    def generate_coding_question(self, job_title: str):
        """Generate a structured coding challenge."""
        prompt = f"""
Generate a coding interview question for a {job_title} role.

Return ONLY valid JSON (no markdown fences):

{{
  "title": "",
  "difficulty": "Easy | Medium | Hard",
  "problem": "",
  "example_input": "",
  "example_output": "",
  "hints": []
}}
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            return self._parse_json(response.choices[0].message.content)
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[WARN] Coding question parse failed: {e}")
            return {
                "title": "Two Sum",
                "difficulty": "Easy",
                "problem": "Given an array of integers, return indices of two numbers that add to a target.",
                "example_input": "nums=[2,7,11,15], target=9",
                "example_output": "[0,1]",
                "hints": ["Use a hash map for O(n) solution"]
            }

    # -----------------------------
    # SYSTEM DESIGN QUESTIONS
    # -----------------------------
    def generate_system_design_question(self, job_title: str):
        """Generate a system design prompt with key topics."""
        prompt = f"""
Generate a system design interview question for a {job_title}.

Return ONLY valid JSON (no markdown fences):

{{
  "question": "",
  "key_topics": [],
  "expected_components": []
}}
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            return self._parse_json(response.choices[0].message.content)
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[WARN] System design parse failed: {e}")
            return {
                "question": "Design a URL shortener like bit.ly",
                "key_topics": ["hashing", "database design", "caching", "scalability"],
                "expected_components": ["API gateway", "hash service", "database", "CDN"]
            }

    # -----------------------------
    # MOCK INTERVIEW SESSION
    # -----------------------------
    def start_mock_interview(self, job_title: str):
        """Return the first question of a mock interview session."""
        prompt = f"""
You are an interviewer for a {job_title} role.

Ask the FIRST interview question to start the session.

Return ONLY valid JSON (no markdown fences):

{{
  "question": "",
  "type": "technical | behavioral"
}}
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            return self._parse_json(response.choices[0].message.content)
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[WARN] Mock interview start parse failed: {e}")
            return {"question": "Tell me about your background and why you're interested in this role.", "type": "behavioral"}

    # -----------------------------
    # ANSWER EVALUATION
    # -----------------------------
    def evaluate_answer(self, question: str, answer: str):
        """Score a candidate's answer with structured feedback."""
        if not answer or not answer.strip():
            return {
                "score": 0,
                "strengths": [],
                "weaknesses": ["No answer provided"],
                "suggested_improvement": "Please provide a response to the question."
            }

        prompt = f"""
Evaluate this interview answer objectively.

Question:
{question}

Candidate Answer:
{answer}

Return ONLY valid JSON (no markdown fences):

{{
  "score": 0,
  "strengths": [],
  "weaknesses": [],
  "suggested_improvement": ""
}}

Score is an integer 0–10. Be fair and constructive.
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            result = self._parse_json(response.choices[0].message.content)
            # Clamp score to valid range
            result["score"] = max(0, min(10, int(result.get("score", 5))))
            return result
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"[WARN] Answer evaluation parse failed: {e}")
            return {
                "score": 5,
                "strengths": ["Response provided"],
                "weaknesses": ["Could not fully evaluate"],
                "suggested_improvement": "Consider structuring your answer using the STAR method."
            }