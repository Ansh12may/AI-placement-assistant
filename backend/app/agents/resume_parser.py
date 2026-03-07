import os
import tempfile
import re
import json
import spacy
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

try:
    nlp = spacy.load("en_core_web_sm")
except:
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")


class ResumeParser:

    def __init__(self):

        self.use_rag = False

        if OPENAI_API_KEY:
            try:
                self.embeddings = OpenAIEmbeddings()
                self.llm = ChatOpenAI(
                    model=LLM_MODEL,
                    temperature=0
                )
                self.use_rag = True
            except:
                self.use_rag = False

        self.skill_keywords = {

            "python","java","javascript","typescript","c","c++","c#","go","rust",
            "ruby","php","kotlin","swift","scala","r",

            "html","css","sass","tailwind","bootstrap",
            "react","reactjs","angular","vue","next.js","nuxt",
            "redux","vite","webpack",

            "node.js","express","django","flask","fastapi",
            "spring","spring boot","laravel","ruby on rails",
            "asp.net","rest api","graphql","grpc",

            "sql","mysql","postgresql","mongodb","redis",
            "sqlite","oracle","cassandra","dynamodb","firebase",

            "aws","azure","gcp","google cloud",
            "ec2","s3","lambda","cloudfront","cloudwatch",

            "docker","kubernetes","terraform","ansible",
            "jenkins","github actions","gitlab ci",
            "ci/cd","devops","linux","nginx",

            "machine learning","deep learning","nlp",
            "computer vision","data science","data analysis",
            "pandas","numpy","matplotlib","seaborn",
            "scikit-learn","tensorflow","keras","pytorch",
            "xgboost","lightgbm",

            "spark","hadoop","kafka","airflow","hive",

            "android","ios","flutter","react native","swiftui",

            "pytest","junit","selenium","cypress","jest",

            "git","github","gitlab","bitbucket",
            "jira","notion","postman","figma",

            "oauth","jwt","authentication","authorization",

            "microservices","serverless","web scraping",
            "etl","api development"
        }

        self.section_headers = [
            "skills",
            "technical skills",
            "projects",
            "experience",
            "work experience",
            "professional experience",
            "education",
            "certifications"
        ]

    # --------------------------------------------------
    # TEXT CLEANING
    # --------------------------------------------------

    def _clean_text(self, text):

        text = text.replace("–", "-")

        text = re.sub(r'[ \t]+', ' ', text)

        text = re.sub(r'\n+', '\n', text)

        return text.strip()

    # --------------------------------------------------
    # FILE HANDLING
    # --------------------------------------------------

    def save_uploaded_file(self, uploaded_file):

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f".{uploaded_file.name.split('.')[-1]}"
        ) as tmp:

            tmp.write(uploaded_file.getbuffer())

            return tmp.name

    # --------------------------------------------------
    # SECTION DETECTION
    # --------------------------------------------------

    def _detect_sections(self, text):

        lines = text.split("\n")

        sections = {}
        current = "header"
        sections[current] = []

        for line in lines:

            clean = line.strip().lower()

            if clean in self.section_headers:
                current = clean
                sections[current] = []
                continue

            sections[current].append(line)

        return {k: "\n".join(v) for k, v in sections.items()}

    # --------------------------------------------------
    # MAIN PARSER
    # --------------------------------------------------

    def parse_resume(self, text):

        if not text:
            return None

        text = self._clean_text(text)

        return self.extract_information(text)

    # --------------------------------------------------
    # EXTRACTION PIPELINE
    # --------------------------------------------------

    def extract_information(self, text):

        doc = nlp(text)
        text_lower = text.lower()

        sections = self._detect_sections(text)

        contact = self._extract_contact(text)
        skills = self._extract_skills(text_lower)
        education = self._extract_education(text, doc)
        experience = self._extract_experience(text)

        projects = self._extract_projects(sections.get("projects", text))

        if self.use_rag and len(projects) == 0:
            projects = self._rag_project_extraction(text)

        return {
            "contact_info": contact,
            "skills": sorted(list(skills)),
            "education": education,
            "experience": experience,
            "projects": projects,
            "raw_text": text
        }

    # --------------------------------------------------
    # CONTACT
    # --------------------------------------------------

    def _extract_contact(self, text):

        email = ""
        phone = ""

        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'(\+?\d[\d\s\-]{8,15}\d)'

        email_match = re.search(email_pattern, text)

        if email_match:
            email = email_match.group().strip()

        phone_match = re.search(phone_pattern, text)

        if phone_match:
            digits = re.sub(r'\D', '', phone_match.group(1))

            if len(digits) > 10:
                digits = digits[-10:]

            phone = digits

        return {
            "email": email,
            "phone": phone
        }

    # --------------------------------------------------
    # SKILLS
    # --------------------------------------------------

    def _extract_skills(self, text_lower):

        found = set()

        for skill in self.skill_keywords:

            pattern = rf"(?<!\w){re.escape(skill)}(?!\w)"

            if re.search(pattern, text_lower):
                found.add(skill)

        return found

    # --------------------------------------------------
    # EDUCATION
    # --------------------------------------------------

    def _extract_education(self, text, doc):

        education = []

        degree_pattern = r'(bachelor|b\.?tech|master|m\.?tech|mba)[^.,\n]{0,80}'

        for match in re.finditer(degree_pattern, text.lower()):
            edu_text = text[match.start():match.end()]
            education.append(edu_text)

        for ent in doc.ents:
            if ent.label_ == "ORG":
                if any(k in ent.text.lower() for k in
                       ["university","college","institute"]):
                    education.append(ent.text)

        return list(set(education))

    # --------------------------------------------------
    # EXPERIENCE
    # --------------------------------------------------

    def _extract_experience(self, text):

        experience = []

        headers = [
            "experience",
            "work experience",
            "professional experience"
        ]

        text_lower = text.lower()

        for h in headers:

            if h in text_lower:
                start = text_lower.find(h)
                experience.append(text[start:start+700])

        return experience

    # --------------------------------------------------
    # PROJECT EXTRACTION
    # --------------------------------------------------

    def _extract_projects(self, section):

        return self._parse_projects(section)

    # --------------------------------------------------
    # PROJECT PARSER
    # --------------------------------------------------

    def _parse_projects(self, section):

        projects = []

        blocks = re.split(
            r'\n(?=[A-Z][A-Za-z0-9\s]{3,40})',
            section
        )

        for block in blocks:

            block = block.strip()

            if len(block) < 50:
                continue

            name_match = re.match(r'^([A-Za-z0-9\s]+)', block)

            name = name_match.group(1).strip() if name_match else "Project"

            name = re.sub(r'\b([A-Z])\s+', r'\1', name)

            github = ""

            gh = re.search(r'https?://github\.com/\S+', block)

            if gh:
                github = gh.group()

            tech_stack = []

            block_lower = block.lower()

            for skill in self.skill_keywords:

                pattern = rf"(?<!\w){re.escape(skill)}(?!\w)"

                if re.search(pattern, block_lower):
                    tech_stack.append(skill)

            description_lines = []

            for line in block.split("\n"):

                line = line.strip()

                if line.startswith("-") or line.startswith("•"):
                    description_lines.append(line)

            description = "\n".join(description_lines)

            if not description:
                description = block

            projects.append({
                "name": name,
                "tech_stack": tech_stack,
                "description": description,
                "github": github
            })

        return projects

    # --------------------------------------------------
    # LLM RAG PROJECT EXTRACTION
    # --------------------------------------------------

    def _rag_project_extraction(self, text):

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150
        )

        chunks = splitter.split_text(text)

        vectorstore = FAISS.from_texts(
            chunks,
            self.embeddings
        )

        retriever = vectorstore.as_retriever()

        prompt = ChatPromptTemplate.from_template(
            """
Extract all projects from the resume.

Return ONLY valid JSON:

[
 {
  "name":"",
  "tech_stack":[],
  "description":"",
  "github":""
 }
]

Context:
{context}
"""
        )

        chain = (
            {
                "context": retriever,
                "question": RunnablePassthrough()
            }
            | prompt
            | self.llm
        )

        try:
            response = chain.invoke("Extract projects")
            return json.loads(response.content)

        except:
            return []