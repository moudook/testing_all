FROM python:3.10
LABEL authors="cobaltboy"

RUN apt-get update && apt-get install -y build-essential libffi-dev python3-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY /app /app

EXPOSE 8000

CMD ["python", "-m" , "app.main"]
