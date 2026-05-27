"""
DL Teacher Crew Orchestrator — coordinates all agents using CrewAI.
"""

import json
import re
from pathlib import Path
from datetime import datetime

from crewai import Crew, Task, Process

from agents import (
    create_planner_agent,
    create_content_agent,
    create_code_agent,
    create_visualization_agent,
    create_quiz_agent,
)
from config import OUTPUTS_DIR, difficulty_settings


class DLTeacherOrchestrator:
    """Orchestrates the multi-agent DL teaching pipeline."""

    def __init__(self, difficulty: str = None):
        self.difficulty = difficulty or difficulty_settings.default_level
        self._init_agents()

    def _init_agents(self):
        """Initialize all agents."""
        self.planner = create_planner_agent()
        self.content = create_content_agent()
        self.coder = create_code_agent()
        self.visualizer = create_visualization_agent()
        self.quizzer = create_quiz_agent()

    def teach(self, topic: str) -> dict:
        """
        Run the full teaching pipeline for a given DL topic.

        Returns a dict with keys: plan, content, code, visualization, quiz
        """
        # ------------------------------------------------------------------ #
        # Define Tasks
        # ------------------------------------------------------------------ #
        plan_task = Task(
            description=(
                f"Create a detailed learning plan for the deep learning topic: '{topic}'.\n"
                f"Difficulty level: {self.difficulty}.\n\n"
                "Your plan should include:\n"
                "1. Overview of the topic and its importance in deep learning\n"
                "2. Prerequisites the learner should know\n"
                "3. 4-6 key subtopics/concepts to cover, with a brief description of each\n"
                "4. Estimated study time for each subtopic\n"
                "5. Learning objectives (what the learner will be able to do after)\n"
                "6. Connections to other DL topics\n\n"
                "Format the output as a clear, structured markdown document."
            ),
            expected_output=(
                "A structured markdown learning plan with sections for overview, prerequisites, "
                "subtopics with descriptions and time estimates, learning objectives, and connections."
            ),
            agent=self.planner,
        )

        content_task = Task(
            description=(
                f"Provide a comprehensive, intuitive explanation of: '{topic}'.\n"
                f"Difficulty level: {self.difficulty}.\n\n"
                "Your explanation must include:\n"
                "1. Intuitive explanation using real-world analogies\n"
                "2. Mathematical intuition (explain what the math means, not just the equations)\n"
                "3. Step-by-step breakdown of how it works\n"
                "4. Common misconceptions and how to avoid them\n"
                "5. Why this concept matters in modern deep learning\n"
                "6. Key takeaways\n\n"
                "Write for a learner at the specified difficulty level. Be engaging and clear."
            ),
            expected_output=(
                "A comprehensive, well-structured markdown explanation covering intuition, "
                "math, step-by-step mechanics, misconceptions, and key takeaways."
            ),
            agent=self.content,
            context=[plan_task],
        )

        code_task = Task(
            description=(
                f"Write clear, well-commented Python code examples for: '{topic}'.\n"
                f"Difficulty level: {self.difficulty}.\n\n"
                "Requirements:\n"
                "1. Use PyTorch for neural network concepts, NumPy for mathematical operations\n"
                "2. Include a 'from scratch' implementation showing the core logic\n"
                "3. Include print statements to show intermediate values\n"
                "4. Add docstrings and inline comments explaining each step\n"
                "5. Show expected output in comments\n"
                "6. Make sure ALL code is syntactically correct and runnable\n"
                "7. Progressively build from simple to more complete examples\n\n"
                "Format as a complete Python script wrapped in a markdown code block."
            ),
            expected_output=(
                "Complete, runnable Python code with clear comments, progressive complexity, "
                "and expected output annotations, wrapped in markdown code blocks."
            ),
            agent=self.coder,
            context=[content_task],
        )

        viz_task = Task(
            description=(
                f"Create Python visualization code to visually explain: '{topic}'.\n"
                f"Difficulty level: {self.difficulty}.\n\n"
                "Requirements:\n"
                "1. Use matplotlib (primary) or plotly for visualizations\n"
                "2. Create 2-3 distinct plots that illuminate different aspects of the concept\n"
                "3. Use descriptive titles, axis labels, and legends\n"
                "4. Use a clean, professional color scheme\n"
                "5. Add annotations to highlight key points\n"
                "6. Save each plot to the 'outputs/visualizations/' directory\n"
                "7. All code must be complete and runnable\n\n"
                "Format as a complete Python script wrapped in a markdown code block."
            ),
            expected_output=(
                "Complete, runnable Python visualization script creating 2-3 labeled, "
                "annotated plots saved to the outputs directory."
            ),
            agent=self.visualizer,
            context=[content_task],
        )

        quiz_task = Task(
            description=(
                f"Create a 5-question multiple choice quiz on: '{topic}'.\n"
                f"Difficulty level: {self.difficulty}.\n\n"
                "Each question must have:\n"
                "- A clear, unambiguous question stem\n"
                "- 4 options labeled A, B, C, D\n"
                "- One clearly correct answer\n"
                "- A brief explanation (2-3 sentences) of why the correct answer is right\n"
                "- A brief note about the most common wrong answer and why it's wrong\n\n"
                "Questions should test conceptual understanding, not just memorization.\n"
                "Include a mix of: conceptual questions, application questions, and 'what would happen if' questions.\n\n"
                "Format as:\n"
                "Q1: [question]\n"
                "A) ...\nB) ...\nC) ...\nD) ...\n"
                "Correct: [letter]\n"
                "Explanation: ...\n"
            ),
            expected_output=(
                "5 well-crafted MCQ questions with 4 options each, correct answers, "
                "and detailed explanations for correct and common wrong answers."
            ),
            agent=self.quizzer,
            context=[content_task],
        )

        # ------------------------------------------------------------------ #
        # Build and run the crew
        # ------------------------------------------------------------------ #
        crew = Crew(
            agents=[self.planner, self.content, self.coder, self.visualizer, self.quizzer],
            tasks=[plan_task, content_task, code_task, viz_task, quiz_task],
            process=Process.sequential,
            verbose=True,
        )

        result = crew.kickoff()

        # Extract individual task outputs
        outputs = {
            "topic": topic,
            "difficulty": self.difficulty,
            "timestamp": datetime.now().isoformat(),
            "plan": plan_task.output.raw if plan_task.output else "",
            "content": content_task.output.raw if content_task.output else "",
            "code": code_task.output.raw if code_task.output else "",
            "visualization": viz_task.output.raw if viz_task.output else "",
            "quiz": quiz_task.output.raw if quiz_task.output else "",
        }

        # Save session output
        self._save_session(outputs)
        return outputs

    def _save_session(self, outputs: dict):
        """Save the teaching session to the outputs directory."""
        topic_slug = re.sub(r"[^a-z0-9]+", "_", outputs["topic"].lower()).strip("_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = OUTPUTS_DIR / f"{topic_slug}_{timestamp}.json"

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(outputs, f, indent=2, ensure_ascii=False)

        return output_file
