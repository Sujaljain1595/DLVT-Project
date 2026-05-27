"""
Deep Learning Virtual Teacher — Main Entry Point

Run with:
    python main.py

Or with a specific topic:
    python main.py --topic "backpropagation" --difficulty intermediate
"""

import argparse
import sys
import io
from pathlib import Path

# Force UTF-8 output on Windows so emoji/unicode render correctly
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).parent))

from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.prompt import Prompt, Confirm
from rich.markdown import Markdown
from rich.rule import Rule
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint

from config import llm_config, difficulty_settings
from orchestrator import DLTeacherOrchestrator

console = Console()


def print_banner():
    """Print a stylized welcome banner."""
    banner = Text()
    banner.append("🧠  Deep Learning Virtual Teacher\n", style="bold cyan")
    banner.append("Powered by CrewAI + Gemini Flash\n", style="dim")
    console.print(Panel(banner, border_style="cyan", padding=(1, 4)))


def print_section(title: str, content: str, color: str = "white"):
    """Print a section with a styled header."""
    console.print()
    console.print(Rule(f"[bold {color}]{title}[/bold {color}]", style=color))
    console.print(Markdown(content))


def validate_api_key():
    """Check that an API key is available."""
    if not llm_config.api_key or llm_config.api_key == "your_gemini_api_key_here":
        console.print(
            Panel(
                "[bold red]❌ No Gemini API key found![/bold red]\n\n"
                "Get a [bold]FREE[/bold] key at: [cyan]https://aistudio.google.com/apikey[/cyan]\n\n"
                "Then add it to [cyan].env[/cyan]:\n"
                "[yellow]GEMINI_API_KEY=AIza...[/yellow]",
                border_style="red",
            )
        )
        sys.exit(1)

    # Mask the key for display
    key = llm_config.api_key
    masked = f"{key[:8]}...{key[-4:]}"
    console.print(f"[green]✓[/green] Gemini API key loaded: [dim]{masked}[/dim]")


def interactive_quiz(quiz_content: str) -> float:
    """
    Parse and run an interactive quiz session.
    Returns the score as a percentage.
    """
    console.print()
    console.print(Rule("[bold yellow]📝 Quiz Time![/bold yellow]", style="yellow"))
    console.print("[dim]Test your understanding — answer A, B, C, or D for each question.[/dim]\n")

    lines = quiz_content.strip().split("\n")
    questions = []
    current_q = {}

    for line in lines:
        line = line.strip()
        if line.startswith("Q") and ":" in line and len(line) < 200:
            if current_q:
                questions.append(current_q)
            current_q = {"question": line, "options": [], "correct": "", "explanation": ""}
        elif line.startswith(("A)", "B)", "C)", "D)")):
            current_q.setdefault("options", []).append(line)
        elif line.startswith("Correct:"):
            current_q["correct"] = line.replace("Correct:", "").strip().upper()
        elif line.startswith("Explanation:"):
            current_q["explanation"] = line.replace("Explanation:", "").strip()

    if current_q and current_q.get("question"):
        questions.append(current_q)

    if not questions:
        console.print("[dim]Could not parse quiz questions. Displaying raw quiz content.[/dim]")
        console.print(Markdown(quiz_content))
        return 0.0

    score = 0
    for i, q in enumerate(questions, 1):
        console.print(f"\n[bold cyan]Question {i}:[/bold cyan] {q['question']}")
        for opt in q.get("options", []):
            console.print(f"  {opt}")

        answer = Prompt.ask(
            "\n  [bold]Your answer[/bold]",
            choices=["A", "B", "C", "D", "a", "b", "c", "d"],
            show_choices=True,
        ).upper()

        correct = q.get("correct", "").strip().upper()[:1]
        if answer == correct:
            console.print("[bold green]  ✓ Correct![/bold green]")
            score += 1
        else:
            console.print(f"[bold red]  ✗ Wrong. Correct answer: {correct}[/bold red]")

        if q.get("explanation"):
            console.print(f"  [dim]{q['explanation']}[/dim]")

    pct = (score / len(questions)) * 100 if questions else 0
    console.print()
    console.print(
        Panel(
            f"[bold]Your Score: {score}/{len(questions)} ({pct:.0f}%)[/bold]\n"
            + (
                "[green]Excellent! You've mastered this topic! 🎉[/green]"
                if pct >= 80
                else "[yellow]Good effort! Review the content and try again. 📖[/yellow]"
                if pct >= 50
                else "[red]Keep studying — you'll get it! 💪[/red]"
            ),
            border_style="cyan",
        )
    )
    return pct


def run_session(topic: str, difficulty: str, skip_quiz: bool = False):
    """Run a complete teaching session for the given topic."""
    console.print()
    console.print(
        Panel(
            f"[bold white]Topic:[/bold white] [cyan]{topic}[/cyan]\n"
            f"[bold white]Difficulty:[/bold white] [yellow]{difficulty}[/yellow]",
            title="[bold]Starting Teaching Session[/bold]",
            border_style="green",
        )
    )

    orchestrator = DLTeacherOrchestrator(difficulty=difficulty)

    console.print("\n[dim]Running multi-agent pipeline... This may take a moment.[/dim]\n")

    try:
        outputs = orchestrator.teach(topic)
    except Exception as e:
        console.print(f"[bold red]Error during teaching session:[/bold red] {e}")
        raise

    # Display results
    print_section("📋 Learning Plan", outputs.get("plan", ""), color="blue")
    print_section("📖 Lesson Content", outputs.get("content", ""), color="green")
    print_section("💻 Code Examples", outputs.get("code", ""), color="magenta")
    print_section("📊 Visualization Code", outputs.get("visualization", ""), color="cyan")

    # Interactive quiz
    quiz_content = outputs.get("quiz", "")
    if quiz_content and not skip_quiz:
        interactive_quiz(quiz_content)
    elif quiz_content:
        print_section("📝 Quiz", quiz_content, color="yellow")

    console.print()
    console.print(
        Panel(
            f"[green]✓[/green] Session complete! Results saved to [cyan]outputs/[/cyan]",
            border_style="green",
        )
    )


def main():
    parser = argparse.ArgumentParser(
        description="Deep Learning Virtual Teacher — AI-powered DL education"
    )
    parser.add_argument("--topic", "-t", type=str, help="DL topic to learn about")
    parser.add_argument(
        "--difficulty",
        "-d",
        choices=difficulty_settings.levels,
        default=difficulty_settings.default_level,
        help="Learning difficulty level",
    )
    parser.add_argument("--no-quiz", action="store_true", help="Skip the interactive quiz")
    args = parser.parse_args()

    print_banner()
    validate_api_key()

    # Get topic interactively if not provided
    topic = args.topic
    if not topic:
        console.print("\n[bold]What deep learning topic would you like to learn?[/bold]")
        console.print(
            "[dim]Examples: backpropagation, attention mechanism, batch normalization, "
            "convolutional neural networks, transformers, dropout, gradient descent[/dim]\n"
        )
        while not topic or not topic.strip():
            topic = Prompt.ask("[cyan]Enter topic[/cyan]")
            if not topic or not topic.strip():
                console.print("[red]Topic cannot be empty. Please enter a valid topic.[/red]")

    # Get difficulty interactively if not specified via args
    difficulty = args.difficulty
    if not args.topic:  # Only ask interactively if topic wasn't provided via args
        difficulty = Prompt.ask(
            "[cyan]Difficulty level[/cyan]",
            choices=difficulty_settings.levels,
            default=difficulty_settings.default_level,
        )

    run_session(topic=topic.strip(), difficulty=difficulty, skip_quiz=args.no_quiz)


if __name__ == "__main__":
    main()