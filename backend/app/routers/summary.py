from fastapi import APIRouter, HTTPException

from app.schemas import ErrorResponse, SummaryRequest, SummaryResponse
from app.services.summary_service import summarize

router = APIRouter(tags=["summary"])


@router.post(
    "/summary",
    response_model=SummaryResponse,
    responses={400: {"model": ErrorResponse}},
)
def create_summary(payload: SummaryRequest) -> SummaryResponse:
    try:
        return summarize(payload.rows)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc