import io

import numpy as np
import pandas as pd

from app.schemas import KpiRow, UploadResponse

REQUIRED_COLUMNS = ["week_start", "brand", "metric", "actual", "target"]
MAX_LINES_SHOWN = 5


class CsvValidationError(ValueError):
    """Raised with a user-facing message when the uploaded CSV is invalid."""


def _lines(mask: pd.Series) -> str:
    """CSV line numbers (the header is line 1) of the rows where mask is True."""
    numbers = [int(i) + 2 for i in mask[mask].index]
    text = ", ".join(str(n) for n in numbers[:MAX_LINES_SHOWN])
    if len(numbers) > MAX_LINES_SHOWN:
        text += f" (and {len(numbers) - MAX_LINES_SHOWN} more)"
    return text


def parse_csv(content: bytes) -> list[KpiRow]:
    if not content.strip():
        raise CsvValidationError("The file is empty.")

    try:
        df = pd.read_csv(
            io.BytesIO(content),
            dtype=str,
            keep_default_na=False,
            skip_blank_lines=False,
            encoding="utf-8-sig",
        )
    except UnicodeDecodeError as exc:
        raise CsvValidationError(
            "The file is not UTF-8 text. Save it as 'CSV UTF-8' and upload it again."
        ) from exc
    except (pd.errors.EmptyDataError, pd.errors.ParserError) as exc:
        raise CsvValidationError(f"Could not read the file as a CSV: {exc}") from exc

    df.columns = [str(c).strip().lower() for c in df.columns]
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise CsvValidationError(
            f"Missing required column(s): {', '.join(missing)}. "
            f"The CSV needs these columns: {', '.join(REQUIRED_COLUMNS)}."
        )

    df = df[REQUIRED_COLUMNS].apply(lambda col: col.str.strip())
    df = df[~(df == "").all(axis=1)]  # ignore fully blank lines, keep line numbers
    if df.empty:
        raise CsvValidationError("The file has a header row but no data rows.")

    blank = (df == "").any(axis=1)
    if blank.any():
        raise CsvValidationError(
            f"Missing values on CSV line(s): {_lines(blank)}. "
            "Every row needs week_start, brand, metric, actual and target."
        )

    dates = pd.to_datetime(df["week_start"], format="%Y-%m-%d", errors="coerce")
    if dates.isna().any():
        raise CsvValidationError(
            "week_start must be a date like 2026-11-09 (YYYY-MM-DD). "
            f"Problem on CSV line(s): {_lines(dates.isna())}."
        )

    numbers: dict[str, pd.Series] = {}
    for col in ("actual", "target"):
        values = pd.to_numeric(df[col], errors="coerce")
        bad = ~np.isfinite(values)
        if bad.any():
            raise CsvValidationError(
                f"'{col}' must be a plain number (no commas, currency symbols or "
                f"text). Problem on CSV line(s): {_lines(bad)}."
            )
        numbers[col] = values

    not_positive = numbers["target"] <= 0
    if not_positive.any():
        raise CsvValidationError(
            "'target' must be greater than 0. "
            f"Problem on CSV line(s): {_lines(not_positive)}."
        )

    keys = pd.DataFrame(
        {"week": dates, "brand": df["brand"], "metric": df["metric"]}
    )
    duplicated = keys.duplicated(keep=False)
    if duplicated.any():
        raise CsvValidationError(
            "Duplicate week_start, brand and metric combination on CSV line(s): "
            f"{_lines(duplicated)}."
        )

    rows = [
        KpiRow(
            week_start=d.date(),
            brand=b,
            metric=m,
            actual=float(a),
            target=float(t),
        )
        for d, b, m, a, t in zip(
            dates, df["brand"], df["metric"], numbers["actual"], numbers["target"]
        )
    ]
    rows.sort(key=lambda r: (r.week_start, r.brand, r.metric))
    return rows


def build_upload_response(rows: list[KpiRow]) -> UploadResponse:
    weeks = sorted({r.week_start for r in rows})
    return UploadResponse(
        rows=rows,
        brands=sorted({r.brand for r in rows}),
        metrics=sorted({r.metric for r in rows}),
        weeks=weeks,
        latest_week=weeks[-1],
    )


def parse_upload(content: bytes) -> UploadResponse:
    return build_upload_response(parse_csv(content))