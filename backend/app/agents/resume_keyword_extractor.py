import re
from collections import Counter


class ResumeKeywordExtractor:
    """
    Extracts high-signal keywords and a likely job title from parsed resume data.
    Optimized for job search, filtering, and recommendation engines.
    """

    def __init__(self):
        # --------------------------------------------------
        # TECH KEYWORDS (NORMALIZED)
        # --------------------------------------------------
        self.tech_keywords = {
            "languages": {
                "python", "java", "javascript", "typescript", "c++", "c#", "ruby",
                "go", "rust", "swift", "kotlin", "php", "scala", "r", "sql",
                "html", "css"
            },
            "frameworks": {
                "react", "angular", "vue", "django", "flask", "spring",
                "express", "rails", "laravel", "asp.net",
                "tensorflow", "pytorch", "keras", "scikit-learn",
                "pandas", "numpy"
            },
            "platforms": {
                "aws", "azure", "gcp", "google cloud", "docker", "kubernetes",
                "jenkins", "git", "github", "gitlab", "linux", "windows",
                "macos", "android", "ios"
            },
            "concepts": {
                "rest", "graphql", "microservices", "ci/cd", "devops",
                "agile", "scrum", "unit testing", "integration testing",
                "machine learning", "deep learning", "data science",
                "cloud", "security", "authentication", "authorization"
            }
        }

        # --------------------------------------------------
        # JOB TITLES (ORDERED BY SPECIFICITY)
        # --------------------------------------------------
        self.job_titles = [
            "machine learning engineer",
            "data scientist",
            "data engineer",
            "devops engineer",
            "site reliability engineer",
            "cloud engineer",
            "frontend developer",
            "backend developer",
            "full stack developer",
            "software engineer",
            "software developer",
            "web developer",
            "qa engineer",
            "product manager",
            "project manager",
            "business analyst",
            "solutions architect",
            "technical lead",
            "engineering manager"
        ]

        # --------------------------------------------------
        # STOPWORDS (RESUME-SPECIFIC)
        # --------------------------------------------------
        self.stopwords = {
            "resume", "cv", "curriculum", "vitae", "summary", "objective",
            "experience", "education", "skills", "projects", "responsibilities",
            "phone", "email", "address", "linkedin", "github", "portfolio",
            "website", "references"
        }

    # --------------------------------------------------
    # PUBLIC API
    # --------------------------------------------------
    def extract_keywords(self, resume_data: dict, max_keywords: int = 10):
        if not resume_data:
            return []

        skills = self._normalize_list(resume_data.get("skills", []))
        experience_text = " ".join(resume_data.get("experience", []))
        education_text = " ".join(resume_data.get("education", []))

        tokens = self._tokenize(experience_text + " " + education_text)

        detected_tech = self._detect_technical_terms(tokens)
        frequency_terms = self._top_frequency_terms(tokens, limit=max_keywords * 2)

        # --------------------------------------------------
        # PRIORITY ORDER
        # 1. Explicit skills
        # 2. Detected technical terms
        # 3. High-frequency context terms
        # --------------------------------------------------
        final_keywords = []

        for source in (skills, detected_tech, frequency_terms):
            for term in source:
                if term not in final_keywords:
                    final_keywords.append(term)
                if len(final_keywords) >= max_keywords:
                    return final_keywords

        return final_keywords

    def extract_job_title(self, resume_data: dict) -> str:
        if not resume_data:
            return "software engineer"

        experience_text = " ".join(resume_data.get("experience", [])).lower()
        skills_text = " ".join(resume_data.get("skills", [])).lower()

        # 1️⃣ Explicit title in experience (highest confidence)
        for title in self.job_titles:
            if title in experience_text:
                return title

        # 2️⃣ Infer from skills
        if self._contains_any(skills_text, {"machine learning", "deep learning", "tensorflow", "pytorch"}):
            return "machine learning engineer"

        if self._contains_any(skills_text, {"data science", "pandas", "numpy", "statistics"}):
            return "data scientist"

        if self._contains_any(skills_text, {"react", "angular", "vue", "html", "css"}):
            return "frontend developer"

        if self._contains_any(skills_text, {"django", "flask", "node", "express", "spring", "api"}):
            return "backend developer"

        if self._contains_any(skills_text, {"docker", "kubernetes", "aws", "azure", "ci/cd"}):
            return "devops engineer"

        return "software engineer"

    # --------------------------------------------------
    # INTERNAL HELPERS
    # --------------------------------------------------
    def _tokenize(self, text: str):
        tokens = re.findall(r"\b[a-zA-Z][a-zA-Z+.#-]{2,}\b", text.lower())
        return [t for t in tokens if t not in self.stopwords]

    def _normalize_list(self, items):
        return list({item.lower().strip() for item in items if len(item) > 2})

    def _detect_technical_terms(self, tokens):
        token_string = " ".join(tokens)
        detected = set()

        for category in self.tech_keywords.values():
            for term in category:
                if re.search(rf"\b{re.escape(term)}\b", token_string):
                    detected.add(term)

        return sorted(detected)

    def _top_frequency_terms(self, tokens, limit=20):
        counter = Counter(tokens)
        return [word for word, _ in counter.most_common(limit)]

    def _contains_any(self, text, terms):
        return any(term in text for term in terms)
