from fastapi import APIRouter
from app.agents.interview_agent import InterviewAgent

router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)


@router.post("/questions")
def generate_questions(data: dict):
    agent = InterviewAgent()
    return agent.generate_questions(data)


@router.post("/coding")
def coding_question(data: dict):
    agent = InterviewAgent()
    return agent.generate_coding_question(
        data["title"]
    )


@router.post("/system-design")
def system_design(data: dict):
    agent = InterviewAgent()
    return agent.generate_system_design_question(
        data["title"]
    )


@router.post("/start")
def start_mock(data: dict):
    agent = InterviewAgent()
    return agent.start_mock_interview(
        data["title"]
    )


@router.post("/evaluate")
def evaluate(data: dict):
    agent = InterviewAgent()
    return agent.evaluate_answer(
        data["question"],
        data["answer"]
    )