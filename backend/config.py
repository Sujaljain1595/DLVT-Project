"""
Configuration settings for the Deep Learning Virtual Teacher.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Optional

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
OUTPUTS_DIR = BASE_DIR / "outputs"
MEMORY_DIR = BASE_DIR / "memory" / "sessions"

# Ensure directories exist
for dir_path in [OUTPUTS_DIR / "visualizations", OUTPUTS_DIR / "code_outputs", MEMORY_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)


class LLMConfig(BaseModel):
    """LLM configuration settings."""
    provider: str = "gemini"
    model: str = "gemini/gemini-2.5-flash"  # Prefix 'gemini/' tells CrewAI to use LiteLLM
    temperature: float = 0.7
    max_tokens: int = 4096
    verbose: bool = True
    api_key: Optional[str] = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    groq_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("GROQ_API_KEY"))

    def get_llm(self):
        from crewai import LLM
        return LLM(
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            api_key=self.api_key,
            max_retries=10, # Crucial: aggressively retry on 503 UNAVAILABLE errors
            timeout=120
        )


class EmbeddingConfig(BaseModel):
    """Embedding model configuration."""
    model: str = "text-embedding-3-small"
    chunk_size: int = 500
    chunk_overlap: int = 50


class AgentConfig(BaseModel):
    """Agent behavior configuration."""
    verbose: bool = True
    max_iterations: int = 10
    allow_delegation: bool = True


class DifficultySettings(BaseModel):
    """Adaptive difficulty settings."""
    levels: list = ["beginner", "intermediate", "advanced"]
    default_level: str = "beginner"
    promotion_threshold: float = 0.8  # Score needed to advance
    demotion_threshold: float = 0.4   # Score triggering easier content


# Global configuration instances
llm_config = LLMConfig()
embedding_config = EmbeddingConfig()
agent_config = AgentConfig()
difficulty_settings = DifficultySettings()
