// apps/web/src/types/audit.ts

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFinding {
    rule: string;
    severity: SeverityLevel;
    reason: string;
}

export interface AuditResult {
    document_id: string;
    risk_score: number;
    status: "PASSED" | "FLAGGED";
    findings: RiskFinding[];
    processing_time_ms: number;
}

// Api Day 1 eke igena gaththa Discriminated Union pattern eka!
export type ActionResponse<T> =
    | {
        success: true;
        data: T;
        error: null;
    }
    | {
        success: false;
        data: null;
        error: string;
    };