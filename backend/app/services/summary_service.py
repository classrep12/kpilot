import pandas as pd

from app.schemas import KpiRow, MetricSummary, RagStatus, SummaryResponse

GREEN_MIN = 100.0  # at or above target
AMBER_MIN = 80.0  # 80 up to (but not including) 100; below 80 is red


def rag_status(pct_achieved: float) -> RagStatus:
    if pct_achieved >= GREEN_MIN:
        return "green"
    if pct_achieved >= AMBER_MIN:
        return "amber"
    return "red"


def summarize(rows: list[KpiRow]) -> SummaryResponse:
    if not rows:
        raise ValueError("There are no rows to summarize.")

    df = pd.DataFrame([r.model_dump() for r in rows])
    if (df["target"] <= 0).any():
        raise ValueError("Every target must be greater than 0.")

    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(["brand", "metric", "week_start"])

    groups = df.groupby(["brand", "metric"], sort=True)
    df["prev_actual"] = groups["actual"].shift(1)
    latest = df.groupby(["brand", "metric"], sort=True).tail(1)

    summaries: list[MetricSummary] = []
    for rec in latest.itertuples(index=False):
        pct = round(rec.actual / rec.target * 100, 1)
        wow = None
        if pd.notna(rec.prev_actual) and rec.prev_actual != 0:
            wow = round((rec.actual - rec.prev_actual) / abs(rec.prev_actual) * 100, 1)
        summaries.append(
            MetricSummary(
                brand=rec.brand,
                metric=rec.metric,
                actual=float(rec.actual),
                target=float(rec.target),
                pct_achieved=pct,
                wow_change=wow,
                rag_status=rag_status(pct),
            )
        )

    return SummaryResponse(
        latest_week=latest["week_start"].max().date(),
        summaries=summaries,
    )