import jsPDF from "jspdf";

interface FindingItem {
    rule: string;
    severity: string;
    reason: string;
}

interface AuditData {
    filename: string;
    documentId: string;
    riskScore: number;
    status: string;
    processingTimeMs: number;
    findings?: FindingItem[];
    createdAt: Date | string;
}

export function generateAuditPdf(audit: AuditData) {
    const doc = new jsPDF();

    // 1. Header & Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("OmniAudit AI - Compliance Report", 14, 22);

    // Subtitle / Divider
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 32, 196, 32);

    // 2. Document Summary Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Audit Summary", 14, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Document Name: ${audit.filename}`, 14, 50);
    doc.text(`Document ID: ${audit.documentId}`, 14, 56);
    doc.text(`Status: ${audit.status}`, 14, 62);
    doc.text(`Risk Score: ${audit.riskScore} / 100`, 14, 68);
    doc.text(`Latency: ${audit.processingTimeMs} ms`, 14, 74);

    // 3. Findings Section
    doc.line(14, 82, 196, 82);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Detailed Violations (${audit.findings?.length || 0})`, 14, 92);

    let yPosition = 102;

    if (!audit.findings || audit.findings.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("No regulatory violations or security risks detected.", 14, yPosition);
    } else {
        audit.findings.forEach((finding, index) => {
            // Box border for each issue
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, yPosition - 5, 182, 20, 2, 2, "FD");

            // Finding details
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text(`${index + 1}. [${finding.rule}] - Severity: ${finding.severity}`, 18, yPosition + 2);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(finding.reason, 18, yPosition + 9);

            yPosition += 26;
        });
    }

    // 4. Download Trigger
    doc.save(`OmniAudit_${audit.filename.replace(/\.[^/.]+$/, "")}_Report.pdf`);
}