"use server";

import { prisma } from "@/lib/prisma";
import { ActionResponse, AuditResult } from "@/types/audit";
import { revalidatePath } from "next/cache";

export async function runDocumentAuditAction(
    filename: string,
    rawText: string
): Promise<ActionResponse<AuditResult>> {
    if (!rawText || rawText.trim().length < 10) {
        return {
            success: false,
            data: null,
            error: "Document text eke aduma tharamin akuru 10k wath thiyenna ona.",
        };
    }

    try {
        const documentId = `doc_${Date.now()}`;

        // 1. Python FastAPI microservice eken audit result eka ganeema
        const response = await fetch("http://127.0.0.1:8000/api/v1/audit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                document_id: documentId,
                filename: filename || "uploaded_doc.txt",
                raw_text: rawText,
                compliance_rules: ["GDPR", "FINANCIAL_RISK", "SECURITY"],
            }),
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`AI Service error: Status code ${response.status}`);
        }

        const data: AuditResult = await response.json();

        // 2. Neon PostgreSQL Database ekata record eka save kireema
        await prisma.auditLog.create({
            data: {
                documentId: data.document_id,
                filename: filename || "uploaded_doc.txt",
                riskScore: data.risk_score,
                status: data.status,
                findingsCount: data.findings.length,
                processingTimeMs: data.processing_time_ms,
                findings: data.findings as any, // Findings JSON array eka database ekata save wenawa
            },
        });

        // Dashboard UI eka refresh nowi instant update wenna cache revalidate kireema
        revalidatePath("/");

        return {
            success: true,
            data,
            error: null,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Service connection failed";
        return {
            success: false,
            data: null,
            error: `Audit fail una: ${message}`,
        };
    }
}

// 3. Database eken history fetch karana server action eka
export async function getAuditHistoryAction() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
        });
        return logs;
    } catch (error) {
        console.error("Failed to fetch audit history:", error);
        return [];
    }
}