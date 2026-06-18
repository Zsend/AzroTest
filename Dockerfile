FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATA_DIR=/data \
    DATABASE_PATH=/data/justice_grows.db

WORKDIR /app

RUN groupadd --system justice && useradd --system --gid justice --home-dir /app justice

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=justice:justice app ./app
COPY --chown=justice:justice data ./data
RUN mkdir -p /data && chown -R justice:justice /data /app

USER justice
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3).read()" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
