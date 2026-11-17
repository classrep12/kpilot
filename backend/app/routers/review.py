from fastapi import APIRouter, HTTPException

from app.schemas import ErrorResponse, ReviewResponse, SummaryResponse
from app.services.llm_service import LlmError, generate_review

router = APIRouter(tags=["review"])


@router.post(
    "/review",
    response_model=ReviewResponse,
    responses={400: {"model": ErrorResponse}, 502: {"model": ErrorResponse}},
)
def create_review(payload: SummaryResponse) -> ReviewResponse:
    try:
        return generate_review(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LlmError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc