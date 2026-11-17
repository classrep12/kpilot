from fastapi import APIRouter, HTTPException, Response

from app.schemas import ErrorResponse, ExportRequest
from app.services.pdf_service import build_pdf

router = APIRouter(tags=["export"])


@router.post(
    "/export/pdf",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "The review pack as a PDF file.",
        },
        400: {"model": ErrorResponse},
    },
)
def export_pdf(payload: ExportRequest) -> Response:
    try:
        pdf = build_pdf(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    filename = f"weekly-review-{payload.summary.latest_week.isoformat()}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )