FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8080

# default port is 8080, for google cloud run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
