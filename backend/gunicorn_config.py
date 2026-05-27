import os
import multiprocessing

# Gunicorn configuration file for production FastAPI deployment

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120  # Crucial: 2 minute timeout to allow long CrewAI pipelines to execute
keepalive = 5
loglevel = "info"
accesslog = "-"
errorlog = "-"
