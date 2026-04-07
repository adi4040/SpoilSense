import io
import logging
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend
import matplotlib.pyplot as plt
from io import BytesIO

logger = logging.getLogger(__name__)


def create_co2_trend_chart(data: list) -> io.BytesIO:
    """Create CO2 trend chart and return as image bytes."""
    try:
        if not data:
            return None
        
        timestamps = [d.get("fullTimestamp", "") for d in data]
        co2_values = [float(d.get("CO2", 0)) for d in data]
        
        fig, ax = plt.subplots(figsize=(10, 4))
        ax.plot(range(len(co2_values)), co2_values, color='#22d3a0', linewidth=2, marker='o', markersize=3)
        ax.set_title('CO₂ Concentration Trend Over Time', fontsize=12, fontweight='bold')
        ax.set_xlabel('Data Points', fontsize=10)
        ax.set_ylabel('CO₂ (ppm)', fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_facecolor('#f8f9fa')
        fig.patch.set_facecolor('white')
        
        # Save to bytes
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        plt.close(fig)
        
        return img_buffer
    except Exception as e:
        logger.error("Failed to create CO2 trend chart: %s", e)
        return None


def create_multi_parameter_chart(data: list) -> io.BytesIO:
    """Create multi-parameter comparison chart and return as image bytes."""
    try:
        if not data:
            return None
        
        co2_values = [float(d.get("CO2", 0)) for d in data]
        temp_values = [float(d.get("Temperature", 0)) * 10 for d in data]  # Scale for visibility
        humidity_values = [float(d.get("Humidity", 0)) for d in data]
        
        fig, ax = plt.subplots(figsize=(10, 4))
        ax.plot(range(len(co2_values)), co2_values, color='#22d3a0', linewidth=1.5, label='CO₂ (ppm)', alpha=0.8)
        ax.plot(range(len(temp_values)), temp_values, color='#fb923c', linewidth=1.5, label='Temp (°C) × 10', alpha=0.8)
        ax.plot(range(len(humidity_values)), humidity_values, color='#38bdf8', linewidth=1.5, label='Humidity (%)', alpha=0.8)
        
        ax.set_title('Multi-Parameter Sensor Comparison', fontsize=12, fontweight='bold')
        ax.set_xlabel('Data Points', fontsize=10)
        ax.set_ylabel('Value', fontsize=10)
        ax.legend(loc='upper left', fontsize=9)
        ax.grid(True, alpha=0.3)
        ax.set_facecolor('#f8f9fa')
        fig.patch.set_facecolor('white')
        
        # Save to bytes
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        plt.close(fig)
        
        return img_buffer
    except Exception as e:
        logger.error("Failed to create multi-parameter chart: %s", e)
        return None


def generate_analytics_pdf(data: list, stats: dict, time_range_label: str) -> bytes:
    """
    Generate a comprehensive PDF report with charts and statistics.
    
    Args:
        data: List of sensor data points
        stats: Dictionary with statistics
        time_range_label: Human-readable time range (e.g., "Last 2 Hours")
        
    Returns:
        PDF content as bytes
    """
    try:
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#374151'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4b5563'),
            spaceAfter=6
        )
        
        # Build PDF content
        content = []
        
        # Title
        content.append(Paragraph("SpoilSense Analytics Report", title_style))
        content.append(Spacer(1, 0.2*inch))
        
        # Metadata
        metadata_data = [
            ["Report Generated:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["Time Range:", time_range_label],
            ["Total Data Points:", str(len(data))],
        ]
        metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4b5563')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        content.append(metadata_table)
        content.append(Spacer(1, 0.3*inch))
        
        # Statistics Section
        if stats:
            content.append(Paragraph("Statistics Summary", heading_style))
            
            stats_data = [
                ["Metric", "Average", "Minimum", "Maximum"],
                [
                    "CO2 (ppm)",
                    str(stats.get("co2_avg", "—")),
                    str(stats.get("co2_min", "—")),
                    str(stats.get("co2_max", "—"))
                ],
                [
                    "Temperature (°C)",
                    str(stats.get("temperature_avg", "—")),
                    str(stats.get("temperature_min", "—")),
                    str(stats.get("temperature_max", "—"))
                ],
                [
                    "Humidity (%)",
                    str(stats.get("humidity_avg", "—")),
                    str(stats.get("humidity_min", "—")),
                    str(stats.get("humidity_max", "—"))
                ],
            ]
            
            stats_table = Table(stats_data, colWidths=[2*inch, 1.3*inch, 1.3*inch, 1.3*inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ]))
            content.append(stats_table)
            content.append(Spacer(1, 0.3*inch))
        
        # Charts
        content.append(PageBreak())
        content.append(Paragraph("Trend Analysis", heading_style))
        
        # CO2 Trend Chart
        co2_chart = create_co2_trend_chart(data)
        if co2_chart:
            img = Image(co2_chart, width=6.5*inch, height=2.5*inch)
            content.append(img)
            content.append(Spacer(1, 0.2*inch))
        
        # Multi-parameter Chart
        multi_chart = create_multi_parameter_chart(data)
        if multi_chart:
            img = Image(multi_chart, width=6.5*inch, height=2.5*inch)
            content.append(img)
            content.append(Spacer(1, 0.2*inch))
        
        # Footer
        content.append(Spacer(1, 0.3*inch))
        footer_text = Paragraph(
            "<i>This report was automatically generated by SpoilSense. "
            "For more information, visit the Analytics dashboard.</i>",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, 
                          textColor=colors.HexColor('#9ca3af'), alignment=TA_CENTER)
        )
        content.append(footer_text)
        
        # Build PDF
        doc.build(content)
        pdf_buffer.seek(0)
        
        logger.info("✓ Generated analytics PDF report (%d KB)", len(pdf_buffer.getvalue()) / 1024)
        return pdf_buffer.getvalue()
        
    except Exception as e:
        logger.error("✗ Failed to generate PDF: %s", e)
        raise
