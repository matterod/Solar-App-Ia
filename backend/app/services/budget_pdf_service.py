"""Budget PDF generation service using WeasyPrint."""

import locale
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Optional

from jinja2 import Environment, FileSystemLoader

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

STATUS_LABELS = {
    "draft": "Borrador",
    "sent": "Enviado",
    "approved": "Aprobado",
    "rejected": "Rechazado",
}


def _format_currency(value: Decimal | float | int | None) -> str:
    """Format a number as Argentine pesos."""
    if value is None:
        return "$0,00"
    v = float(value)
    # Use manual formatting for Argentine style: $XXX.XXX,XX
    if v < 0:
        return f"-${abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"${v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _format_quantity(value: Decimal | float | int) -> str:
    """Format quantity — remove decimals if integer."""
    v = float(value)
    if v == int(v):
        return str(int(v))
    return f"{v:.2f}".replace(".", ",")


def _format_date(d) -> str:
    """Format a date for display."""
    if d is None:
        return ""
    if isinstance(d, str):
        return d
    return d.strftime("%d/%m/%Y")


def generate_budget_pdf(
    budget: Any,
    client: Optional[Any],
    installation: Optional[Any],
    company: Optional[Any],
) -> bytes:
    """Generate a PDF for the given budget. Returns PDF bytes."""
    try:
        from weasyprint import HTML
    except ImportError:
        raise RuntimeError(
            "WeasyPrint is not installed. Install it with: pip install weasyprint"
        )

    # Prepare template data
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("budget_pdf.html")

    # Format items
    items_data = []
    for item in sorted(budget.items, key=lambda x: x.sort_order):
        items_data.append({
            "description": item.description,
            "quantity_fmt": _format_quantity(item.quantity),
            "unit_price_fmt": _format_currency(item.unit_price),
            "total_fmt": _format_currency(item.total),
        })

    html_content = template.render(
        budget=budget,
        client=client,
        installation=installation,
        company_name=company.name if company else "Solar ERP",
        company_address=None,  # Text-based header, no address on company model yet
        company_phone=None,
        company_email=None,
        items=items_data,
        subtotal_fmt=_format_currency(budget.subtotal),
        tax_rate=f"{float(budget.tax_rate):.0f}" if float(budget.tax_rate) == int(float(budget.tax_rate)) else f"{float(budget.tax_rate):.2f}",
        tax_amount_fmt=_format_currency(budget.tax_amount),
        total_fmt=_format_currency(budget.total),
        created_date=_format_date(budget.created_at),
        valid_until=_format_date(budget.valid_until) if budget.valid_until else None,
        status_label=STATUS_LABELS.get(budget.status, budget.status),
        generated_date=datetime.now().strftime("%d/%m/%Y %H:%M"),
    )

    # Generate PDF
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
