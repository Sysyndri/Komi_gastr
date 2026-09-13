# ============================================================================
# Dockerfile — документация (MkDocs Material)
# ============================================================================
FROM python:3.12-alpine

WORKDIR /app

RUN pip install --no-cache-dir \
    mkdocs==1.6.1 \
    mkdocs-material==9.5.34

COPY . .

EXPOSE 8000

CMD ["mkdocs", "serve", "-a", "0.0.0.0:8000"]