from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import ErrorResponse, UploadResponse
from app.services.csv_service import CsvValidationError, parse_upload

router = APIRouter(tags=["upload"])

MAX_UPLOAD_BYTES = 2 * 1024 * 1024


@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={400: {"model": ErrorResponse}, 413: {"model": ErrorResponse}},
)
async def upload_csv(file: UploadFile = File(...)) -> UploadResponse:
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is too large (limit 2 MB).")

    try:
        return parse_upload(content)
    except CsvValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc