"""Generate the synthetic test document used to exercise the CGB Pulse document pipeline.

    python make_test_document.py [out.pdf]

Every figure in it is invented; it deliberately mentions entities and regions that exist in the
cgbp_* objects (LABOUR, MUNICIPAL, Al Rayyan) so the analysis can be checked against live data.
"""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

out = sys.argv[1] if len(sys.argv) > 1 else 'labour-q3-service-review.pdf'
s = getSampleStyleSheet()
doc = SimpleDocTemplate(out, pagesize=A4, title='Labour Services — Q3 2026 Service Review')
story = [
    Paragraph('Labour Services — Q3 2026 Service Review', s['Title']),
    Paragraph('Prepared for the Government Service Performance Committee · synthetic sample document', s['Italic']),
    Spacer(1, 12),
    Paragraph('1. Summary', s['Heading2']),
    Paragraph('Citizen satisfaction with Labour Services fell to 64.1% in August 2026, the lowest of the twelve '
              'entities and 15.9 points below the 80% service target. The decline is concentrated in contract '
              'attestation, where the backlog reached 4,850 open requests and the median wait rose to 19 working days.', s['BodyText']),
    Paragraph('2. Findings', s['Heading2']),
    Paragraph('• Attestation backlog: 4,850 open requests, up 38% in the quarter; 61% older than 10 days.', s['BodyText']),
    Paragraph('• Al Rayyan centre handles 44% of attestation walk-ins with 9% of counters; waits exceed 2 hours at peak.', s['BodyText']),
    Paragraph('• 27% of complaints cite documents requested that were not on the published checklist.', s['BodyText']),
    Paragraph('• The online attestation service is used by only 31% of applicants because the upload step fails on mobile.', s['BodyText']),
    Spacer(1, 8),
    Table([['Metric', 'Q2 2026', 'Q3 2026', 'Target'],
           ['Satisfaction', '69.8%', '64.1%', '80%'],
           ['Median attestation wait (days)', '12', '19', '5'],
           ['Online share of attestations', '35%', '31%', '70%'],
           ['Complaints per 1,000 requests', '41', '58', '20']],
          style=TableStyle([('GRID', (0, 0), (-1, -1), 0.5, colors.grey), ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8A1538')),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white)])),
    Paragraph('3. Risks', s['Heading2']),
    Paragraph('If the backlog is not cleared before the October contract-renewal peak, the model projects satisfaction '
              'falling below 60% and complaint volumes doubling. Municipal Permits shares the Al Rayyan premises and is '
              'already absorbing overflow.', s['BodyText']),
    Paragraph('4. Recommendations', s['Heading2']),
    Paragraph('a) A 30-day backlog sprint with extended evening hours at Al Rayyan (owner: Labour Services operations).', s['BodyText']),
    Paragraph('b) Publish one complete document checklist and reject nothing that is not on it (owner: service design).', s['BodyText']),
    Paragraph('c) Fix the mobile upload step and send proactive SMS status updates (owner: National Portal).', s['BodyText']),
]
doc.build(story)
print('wrote', out)
