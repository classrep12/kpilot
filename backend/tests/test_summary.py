from datetime import date
from pathlib import Path

import pytest

from app.schemas import KpiRow
from app.services.csv_service import parse_csv
from app.services.summary_service import AMBER_MIN, GREEN_MIN, rag_status, summarize

SAMPLE_CSV = Path(__file__).resolve().parent.parent / "data" / "sample_kpis.csv"


def row(week, actual, target=100.0, brand="B", metric="leads"):
    return KpiRow(
        week_start=week, brand=brand, metric=metric, actual=actual, target=target
    )


# --- RAG status -----------------------------------------------------------


def test_thresholds_match_spec():
    assert GREEN_MIN == 100.0
    assert AMBER_MIN == 80.0


@pytest.mark.parametrize(
    "pct, expected",
    [
        (150.0, "green"),
        (100.0, "green"),
        (99.9, "amber"),
        (90.0, "amber"),
        (80.0, "amber"),
        (79.9, "red"),
        (50.0, "red"),
        (0.0, "red"),
    ],
)
def test_rag_status_boundaries(pct, expected):
    assert rag_status(pct) == expected


def test_status_follows_the_rounded_percentage():
    # 99.96% displays as 100.0%, so it must be green; 79.96% displays as 80.0%.
    assert summarize([row("2026-11-09", 99.96)]).summaries[0].rag_status == "green"
    assert summarize([row("2026-11-09", 79.96)]).summaries[0].rag_status == "amber"


# --- latest week and week-over-week change -------------------------------


def test_uses_the_latest_week():
    res = summarize([row("2026-11-02", 90), row("2026-11-09", 110)])
    s = res.summaries[0]
    assert res.latest_week == date(2026, 11, 9)
    assert s.actual == 110.0
    assert s.pct_achieved == 110.0
    assert s.rag_status == "green"


def test_wow_change_increase():
    s = summarize([row("2026-11-02", 90), row("2026-11-09", 110)]).summaries[0]
    assert s.wow_change == 22.2


def test_wow_change_decrease():
    s = summarize([row("2026-11-02", 120), row("2026-11-09", 90)]).summaries[0]
    assert s.wow_change == -25.0


def test_wow_change_is_none_without_a_previous_week():
    assert summarize([row("2026-11-09", 110)]).summaries[0].wow_change is None


def test_wow_change_is_none_when_previous_actual_is_zero():
    s = summarize([row("2026-11-02", 0), row("2026-11-09", 50)]).summaries[0]
    assert s.wow_change is None


# --- grouping and ordering ------------------------------------------------


def test_each_brand_and_metric_uses_its_own_latest_row():
    rows = [
        row("2026-11-02", 80, brand="A"),
        row("2026-11-09", 120, brand="A"),
        row("2026-11-02", 70, brand="B"),  # B has no row for the latest week
    ]
    res = summarize(rows)
    by_brand = {s.brand: s for s in res.summaries}
    assert res.latest_week == date(2026, 11, 9)
    assert len(res.summaries) == 2
    assert by_brand["A"].actual == 120.0
    assert by_brand["B"].actual == 70.0
    assert by_brand["B"].wow_change is None


def test_input_order_does_not_matter():
    rows = [
        row("2026-11-02", 90),
        row("2026-11-09", 110),
        row("2026-11-02", 5, brand="A", metric="revenue_inr"),
        row("2026-11-09", 7, brand="A", metric="revenue_inr"),
    ]
    forward = summarize(rows).model_dump()
    backward = summarize(list(reversed(rows))).model_dump()
    assert forward == backward


def test_summaries_are_sorted_by_brand_then_metric():
    rows = [
        row("2026-11-09", 1, brand="Z", metric="leads"),
        row("2026-11-09", 1, brand="A", metric="revenue_inr"),
        row("2026-11-09", 1, brand="A", metric="leads"),
    ]
    got = [(s.brand, s.metric) for s in summarize(rows).summaries]
    assert got == [("A", "leads"), ("A", "revenue_inr"), ("Z", "leads")]


# --- bad input ------------------------------------------------------------


def test_empty_rows_raise():
    with pytest.raises(ValueError, match="no rows"):
        summarize([])


def test_zero_target_raises():
    with pytest.raises(ValueError, match="greater than 0"):
        summarize([row("2026-11-09", 5, target=0)])


# --- the generated sample data -------------------------------------------


def test_sample_data_summary():
    res = summarize(parse_csv(SAMPLE_CSV.read_bytes()))
    assert res.latest_week == date(2026, 11, 9)
    assert len(res.summaries) == 12  # 3 brands x 4 metrics
    assert {s.rag_status for s in res.summaries} == {"green", "amber", "red"}