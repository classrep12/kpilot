import json
import time
from datetime import timedelta

from google import genai
from google.genai import errors, types

from app.config import settings
from app.schemas import ReviewResponse, SummaryResponse

REQUEST_TIMEOUT_MS = 60_000
MAX_TRANSIENT_RETRIES = 2  # extra tries after a timeout or a 5xx error
MAX_JSON_RETRIES = 1  # one repair attempt when the JSON is invalid
DEADLINE_WINDOW_DAYS = 14  # accepted window; the prompt asks for 7

SYSTEM_INSTRUCTION = """You are a business analyst writing a weekly KPI review for a founder.

Use ONLY the numbers in the data provided. Never invent figures, causes, campaigns, events or people. If the data cannot explain why a metric moved, say so and make the follow-up an investigation.

Meaning of the data:
- pct_achieved = actual / target * 100. Higher is better for every metric.
- rag_status: green = at or above target, amber = 80 to 99.9 percent of target, red = below 80 percent.
- wow_change is the percent change versus the previous week. It is null when there is no previous week.
- revenue_inr is in Indian rupees. Write amounts like "Rs 4.2 lakh" or "Rs 1.5 crore". Never use the rupee symbol.
- conversion_rate is a percentage.

Output rules:
- headline: ONE sentence of at most 30 words covering all brands, with the single most important number.
- brand_summaries: exactly one entry per brand, at most 2 sentences each, citing real numbers.
- risks: 3 to 6 items in total, ranked by importance, each tagged with its brand and citing real numbers such as pct_achieved or wow_change. If everything is green, list watch items instead.
- follow_ups: 2 to 8 items in total. Every brand that has an amber or red metric needs at least one. Each has a brand, a concrete task, an owner, a deadline and a priority.
- owner: a ROLE placeholder such as "Sales lead", "Marketing lead", "Admissions head" or "Founder". NEVER a person's name.
- deadline: a date in YYYY-MM-DD format between review_date and 7 days after review_date.
- priority: "high" for red metrics, "medium" for amber, "low" otherwise.
- Use the exact brand names given."""


class LlmError(Exception):
    """Raised with a user-facing message when the review could not be generated."""


_client = genai.Client(
    api_key=settings.gemini_api_key,
    http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
)


def build_prompt(summary: SummaryResponse) -> str:
    review_date = summary.latest_week + timedelta(days=7)
    payload = {
        "latest_week_start": summary.latest_week.isoformat(),
        "review_date": review_date.isoformat(),
        "brands": sorted({s.brand for s in summary.summaries}),
        "metrics": [s.model_dump() for s in summary.summaries],
    }
    return (
        "Write the weekly review for the brands in this data.\n\n"
        + json.dumps(payload, indent=2)
    )


def check_review(review: ReviewResponse, summary: SummaryResponse) -> None:
    """Raise ValueError describing everything wrong with the review."""
    brands = sorted({s.brand for s in summary.summaries})
    review_date = summary.latest_week + timedelta(days=7)
    earliest = review_date
    latest = review_date + timedelta(days=DEADLINE_WINDOW_DAYS)
    problems: list[str] = []

    if not review.headline.strip():
        problems.append("headline is empty")

    if sorted(b.brand for b in review.brand_summaries) != brands:
        problems.append(
            f"brand_summaries must contain exactly one entry for each brand: {brands}"
        )

    unknown = {
        item.brand for item in [*review.risks, *review.follow_ups]
    } - set(brands)
    if unknown:
        problems.append(f"unknown brand(s) {sorted(unknown)}; use only: {brands}")

    if not review.follow_ups:
        problems.append("at least one follow-up is required")

    needing_action = {s.brand for s in summary.summaries if s.rag_status != "green"}
    missing = needing_action - {f.brand for f in review.follow_ups}
    if missing:
        problems.append(
            f"no follow-up for brand(s) with amber or red metrics: {sorted(missing)}"
        )

    for f in review.follow_ups:
        if not f.task.strip() or not f.owner.strip():
            problems.append("every follow-up needs a task and an owner")
            break

    out_of_window = [
        f.deadline
        for f in review.follow_ups
        if not earliest <= date_from_iso(f.deadline) <= latest
    ]
    if out_of_window:
        problems.append(
            f"follow-up deadline(s) must be between {earliest} and {latest} "
            f"(got {', '.join(out_of_window)})"
        )

    if problems:
        raise ValueError("; ".join(problems))


def date_from_iso(value: str):
    from datetime import date

    return date.fromisoformat(value)


def _client_error_message(exc: errors.ClientError) -> str:
    code = getattr(exc, "code", None)
    if code == 429:
        return "Gemini rate limit or quota reached. Wait a minute and try again."
    if code in (400, 401, 403):
        return "Gemini rejected the request. Check GEMINI_API_KEY in backend/.env."
    if code == 404:
        return (
            f"Gemini model '{settings.gemini_model}' was not found. "
            "Check GEMINI_MODEL in backend/.env."
        )
    return f"Gemini returned an error ({code})."


def _call_gemini(contents: str, config: types.GenerateContentConfig) -> str:
    last_error: Exception | None = None
    for attempt in range(MAX_TRANSIENT_RETRIES + 1):
        try:
            response = _client.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
            return response.text or ""
        except errors.ClientError as exc:
            raise LlmError(_client_error_message(exc)) from exc
        except Exception as exc:  # timeouts, 5xx, connection problems
            last_error = exc
            if attempt < MAX_TRANSIENT_RETRIES:
                time.sleep(1.5 * (attempt + 1))
    raise LlmError(
        "Gemini did not respond (it may be busy). Please try again in a moment."
    ) from last_error


def generate_review(summary: SummaryResponse) -> ReviewResponse:
    if not summary.summaries:
        raise ValueError("There are no summaries to review.")

    prompt = build_prompt(summary)
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=ReviewResponse,
        temperature=0.3,
    )

    contents = prompt
    last_problem = ""
    for _ in range(MAX_JSON_RETRIES + 1):
        text = _call_gemini(contents, config)
        try:
            review = ReviewResponse.model_validate_json(text)
            check_review(review, summary)
            return review
        except ValueError as exc:  # includes pydantic.ValidationError
            last_problem = str(exc)
            contents = (
                prompt
                + "\n\nYour previous answer was rejected: "
                + last_problem[:600]
                + "\nReturn corrected JSON only."
            )

    raise LlmError(
        "Gemini returned a review that failed validation twice. "
        f"Please try again. ({last_problem[:200]})"
    )