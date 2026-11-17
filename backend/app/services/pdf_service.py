import io
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas import ExportRequest, MetricSummary

STATUS_COLORS = {
    "green": colors.HexColor("#15803d"),
    "amber": colors.HexColor("#b45309"),
    "red": colors.HexColor("#b91c1c"),
}
PRIORITY_COLORS = {
    "high": "#b91c1c",
    "medium": "#b45309",
    "low": "#4b5563",
}
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6b7280")
LINE = colors.HexColor("#e5e7eb")
HEADER_BG = colors.HexColor("#f3f4f6")

_REPLACEMENTS = {
    "\u20b9": "Rs ",
    "\u2192": "->",
    "\u2190": "<-",
    "\u2265": ">=",
    "\u2264": "<=",
    "\u2248": "~",
    "\u2713": "ok",
    "\u2011": "-",
    "\u2212": "-",
    "\u00a0": " ",
    "\u202f": " ",
}

_base = getSampleStyleSheet()
TITLE = ParagraphStyle(
    "PackTitle", parent=_base["Title"], fontName="Helvetica-Bold",
    fontSize=22, leading=26, alignment=0, textColor=INK, spaceAfter=2,
)
SUBTITLE = ParagraphStyle(
    "PackSubtitle", parent=_base["Normal"], fontSize=10, leading=13,
    textColor=MUTED, spaceAfter=12,
)
H2 = ParagraphStyle(
    "PackH2", parent=_base["Heading2"], fontName="Helvetica-Bold",
    fontSize=12, leading=15, textColor=INK, spaceBefore=14, spaceAfter=6,
)
BODY = ParagraphStyle(
    "PackBody", parent=_base["BodyText"], fontSize=10, leading=14, textColor=INK,
)
HEADLINE = ParagraphStyle(
    "PackHeadline", parent=BODY, fontName="Helvetica-Bold", fontSize=13, leading=18,
)
CELL = ParagraphStyle("PackCell", parent=BODY, fontSize=9, leading=12)
BULLET = ParagraphStyle(
    "PackBullet", parent=BODY, leftIndent=12, bulletIndent=0, spaceAfter=4,
)


def clean(text: object) -> str:
    out = str(text)
    for src, dst in _REPLACEMENTS.items():
        out = out.replace(src, dst)
    return out.encode("cp1252", errors="replace").decode("cp1252")


def safe(text: object) -> str:
    return escape(clean(text))


def metric_label(metric: str) -> str:
    text = metric.replace("_inr", " (INR)").replace("_", " ").strip()
    return clean(text[:1].upper() + text[1:])


def fmt_inr(value: float) -> str:
    sign = "-" if value < 0 else ""
    v = abs(value)
    if v >= 1e7:
        return f"{sign}Rs {v / 1e7:.2f} crore"
    if v >= 1e5:
        return f"{sign}Rs {v / 1e5:.1f} lakh"
    return f"{sign}Rs {v:,.0f}"


def fmt_value(metric: str, value: float) -> str:
    key = metric.lower()
    if key.endswith("_inr"):
        return fmt_inr(value)
    if "rate" in key or "conversion" in key:
        return f"{value:.2f}%"
    return f"{value:,.0f}" if float(value).is_integer() else f"{value:,.1f}"


def fmt_wow(value: float | None) -> str:
    return "n/a" if value is None else f"{value:+.1f}%"


def _counts(metrics: list[MetricSummary]) -> dict[str, int]:
    return {s: sum(m.rag_status == s for m in metrics) for s in STATUS_COLORS}


def _overview_table(brands: dict[str, list[MetricSummary]]) -> Table:
    rows = [["Brand", "Green", "Amber", "Red"]]
    for brand, metrics in brands.items():
        c = _counts(metrics)
        rows.append([clean(brand), str(c["green"]), str(c["amber"]), str(c["red"])])

    table = Table(
        rows, colWidths=[78 * mm, 32 * mm, 32 * mm, 32 * mm], repeatRows=1
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), HEADER_BG),
                ("BACKGROUND", (1, 0), (1, 0), STATUS_COLORS["green"]),
                ("BACKGROUND", (2, 0), (2, 0), STATUS_COLORS["amber"]),
                ("BACKGROUND", (3, 0), (3, 0), STATUS_COLORS["red"]),
                ("TEXTCOLOR", (1, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 1), (-1, -1), INK),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _kpi_table(metrics: list[MetricSummary]) -> Table:
    rows = [["Metric", "Actual", "Target", "% achieved", "WoW", "Status"]]
    for m in metrics:
        rows.append(
            [
                metric_label(m.metric),
                fmt_value(m.metric, m.actual),
                fmt_value(m.metric, m.target),
                f"{m.pct_achieved:.1f}%",
                fmt_wow(m.wow_change),
                m.rag_status.upper(),
            ]
        )

    table = Table(
        rows,
        colWidths=[46 * mm, 30 * mm, 30 * mm, 24 * mm, 20 * mm, 24 * mm],
        repeatRows=1,
    )
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("ALIGN", (1, 0), (4, -1), "RIGHT"),
        ("ALIGN", (5, 0), (5, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i, m in enumerate(metrics, start=1):
        commands += [
            ("BACKGROUND", (5, i), (5, i), STATUS_COLORS[m.rag_status]),
            ("TEXTCOLOR", (5, i), (5, i), colors.white),
            ("FONTNAME", (5, i), (5, i), "Helvetica-Bold"),
        ]
    table.setStyle(TableStyle(commands))
    return table


def _follow_up_table(follow_ups: list) -> Table:
    rows = [
        [
            Paragraph("<b>Task</b>", CELL),
            Paragraph("<b>Owner</b>", CELL),
            Paragraph("<b>Deadline</b>", CELL),
            Paragraph("<b>Priority</b>", CELL),
        ]
    ]
    for f in follow_ups:
        color = PRIORITY_COLORS.get(f.priority, "#4b5563")
        rows.append(
            [
                Paragraph(safe(f.task), CELL),
                Paragraph(safe(f.owner), CELL),
                Paragraph(safe(f.deadline), CELL),
                Paragraph(
                    f'<font color="{color}"><b>{safe(f.priority.upper())}</b></font>',
                    CELL,
                ),
            ]
        )

    table = Table(
        rows, colWidths=[84 * mm, 34 * mm, 26 * mm, 30 * mm], repeatRows=1
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_pdf(data: ExportRequest) -> bytes:
    summary = data.summary
    review = data.review
    if not summary.summaries:
        raise ValueError("There are no summaries to export.")

    week = summary.latest_week.isoformat()
    brands: dict[str, list[MetricSummary]] = {}
    for m in summary.summaries:
        brands.setdefault(m.brand, []).append(m)
    brands = dict(sorted(brands.items()))

    story = [
        Paragraph("Weekly KPI review", TITLE),
        Paragraph(
            f"Week starting {safe(week)} &nbsp;|&nbsp; "
            f"{len(brands)} brand{'s' if len(brands) != 1 else ''}",
            SUBTITLE,
        ),
        Paragraph(safe(review.headline), HEADLINE),
        Paragraph("At a glance", H2),
        _overview_table(brands),
    ]

    for brand, metrics in brands.items():
        c = _counts(metrics)
        brand_summary = next(
            (b.summary for b in review.brand_summaries if b.brand == brand), None
        )
        risks = [r for r in review.risks if r.brand == brand]
        follow_ups = [f for f in review.follow_ups if f.brand == brand]

        story += [
            PageBreak(),
            Paragraph(safe(brand), TITLE),
            Paragraph(
                f"Week starting {safe(week)} &nbsp;|&nbsp; "
                f"{c['green']} green, {c['amber']} amber, {c['red']} red",
                SUBTITLE,
            ),
        ]
        if brand_summary:
            story.append(Paragraph(safe(brand_summary), BODY))

        story += [Paragraph("Numbers vs target", H2), _kpi_table(metrics)]

        story.append(Paragraph("Risks", H2))
        if risks:
            for r in risks:
                story.append(
                    Paragraph(safe(r.description), BULLET, bulletText="\u2022")
                )
        else:
            story.append(Paragraph("No risks listed for this brand.", BODY))

        story.append(Paragraph("Follow-ups", H2))
        if follow_ups:
            story.append(_follow_up_table(follow_ups))
        else:
            story.append(Paragraph("No follow-ups listed for this brand.", BODY))
        story.append(Spacer(1, 6))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(
           18 * mm, 10 * mm, f"KPilot | Week of {week}"
        )
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
        canvas.restoreState()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"Weekly KPI review - week of {week}",
        author="KPilot",
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()