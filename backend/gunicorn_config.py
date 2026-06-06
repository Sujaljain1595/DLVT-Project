import os
# Gunicorn configuration file for production FastAPI deployment

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = int(os.getenv("WEB_CONCURRENCY", "1"))
worker_class = "uvicorn.workers.UvicornWorker"
timeout = int(os.getenv("WORKER_TIMEOUT", "180"))
keepalive = 5
loglevel = "info"
accesslog = "-"
errorlog = "-"
