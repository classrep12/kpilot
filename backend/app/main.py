from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import export, review, summary, upload

app = FastAPI(title="KPilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(upload.router)
app.include_router(summary.router)
app.include_router(review.router)
app.include_router(export.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": settings.gemini_model}