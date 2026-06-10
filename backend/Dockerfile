FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Render provides the PORT environment variable dynamically.
# We default to 8000 for local development.
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
