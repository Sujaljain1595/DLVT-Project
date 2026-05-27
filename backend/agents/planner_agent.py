"""
Planner Agent — generates a structured deep learning learning plan.
"""

from crewai import Agent
from config import llm_config


def create_planner_agent() -> Agent:
    """Create and return the Planner Agent."""
    return Agent(
        role="Deep Learning Curriculum Planner",
        goal=(
            "Design a comprehensive, well-structured learning plan for deep learning topics. "
            "Break topics into digestible subtopics with clear learning objectives and estimated time."
        ),
        backstory=(
            "You are an expert curriculum designer with 15+ years of experience in machine learning "
            "education. You have taught at top universities and know how to scaffold complex DL concepts "
            "into a logical, progressive learning journey. You understand how different concepts build "
            "upon each other and create clear dependency graphs for learners."
        ),
        llm=llm_config.get_llm(),
        verbose=llm_config.verbose,
        allow_delegation=False,
        max_iter=5,
    )
