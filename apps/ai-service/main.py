from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import time

app = FastAPI(
    title="OmniAudit AI Engine",
    version="1.0.0",
    description="Microservice for Document Risk Analysis & Compliance Checking"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DocumentPayload(BaseModel):
    document_id: str
    filename: str
    raw_text: str = Field(..., min_length=10)
    compliance_rules: List[str] = ["GDPR", "FINANCIAL_RISK", "SECURITY"]

class RiskFinding(BaseModel):
    rule: str
    severity: str
    reason: str

class AuditResult(BaseModel):
    document_id: str
    risk_score: int
    status: str
    findings: List[RiskFinding]
    processing_time_ms: float

@app.post("/api/v1/audit", response_model=AuditResult)
def run_compliance_audit(payload: DocumentPayload):
    start_time = time.time()
    findings: List[RiskFinding] = []
    text_lower = payload.raw_text.lower()
    
    if "credit card" in text_lower or "cvv" in text_lower or "password" in text_lower:
        findings.append(RiskFinding(
            rule="SECURITY",
            severity="CRITICAL",
            reason="Unmasked sensitive credentials detected in document body."
        ))
        
    if "confidential" in text_lower or "nda" in text_lower:
        findings.append(RiskFinding(
            rule="GDPR",
            severity="MEDIUM",
            reason="Contains non-disclosure/confidential proprietary statements."
        ))
        
    if "refund" in text_lower or "penalty" in text_lower or "overdue" in text_lower:
        findings.append(RiskFinding(
            rule="FINANCIAL_RISK",
            severity="HIGH",
            reason="Potential financial penalty or breach clause identified."
        ))

    severity_weights = {"CRITICAL": 50, "HIGH": 30, "MEDIUM": 15, "LOW": 5}
    total_score = sum(severity_weights.get(f.severity, 0) for f in findings)
    risk_score = min(total_score, 100)
    status = "FLAGGED" if risk_score >= 30 else "PASSED"
    elapsed = round((time.time() - start_time) * 1000, 2)

    return AuditResult(
        document_id=payload.document_id,
        risk_score=risk_score,
        status=status,
        findings=findings,
        processing_time_ms=elapsed
    )