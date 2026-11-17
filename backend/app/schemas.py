from datetime import date
from typing import Literal

from pydantic import BaseModel, field_validator

RagStatus = Literal["green", "amber", "red"]
Priority = Literal["high", "medium", "low"]


class KpiRow(BaseModel):
    """One parsed row of the uploaded CSV."""

    week_start: date
    brand: str
    metric: str
    actual: float
    target: float


class MetricSummary(BaseModel):
    """Latest-week result for one brand and metric.

    pct_achieved is actual / target * 100.
    wow_change is the percent change of actual versus the previous week,
    or null when there is no previous week.
    """

    brand: str
    metric: str
    actual: float
    target: float
    pct_achieved: float
    wow_change: float | None = None
    rag_status: RagStatus


class UploadResponse(BaseModel):
    rows: list[KpiRow]
    brands: list[str]
    metrics: list[str]
    weeks: list[date]
    latest_week: date


class SummaryRequest(BaseModel):
    rows: list[KpiRow]


class SummaryResponse(BaseModel):
    latest_week: date
    summaries: list[MetricSummary]


class BrandSummary(BaseModel):
    """Short written summary of one brand's week."""

    brand: str
    summary: str


class Risk(BaseModel):
    brand: str
    description: str


class FollowUp(BaseModel):
    brand: str
    task: str
    owner: str  # a role placeholder such as "Sales lead", never a person's name
    deadline: str  # YYYY-MM-DD
    priority: Priority

    @field_validator("deadline")
    @classmethod
    def deadline_is_iso_date(cls, value: str) -> str:
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("deadline must be a date in YYYY-MM-DD format") from exc
        return value


class ReviewResponse(BaseModel):
    headline: str
    brand_summaries: list[BrandSummary]
    risks: list[Risk]
    follow_ups: list[FollowUp]


class ExportRequest(BaseModel):
    summary: SummaryResponse
    review: ReviewResponse


class ErrorResponse(BaseModel):
    detail: str