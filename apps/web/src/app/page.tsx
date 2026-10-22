// apps/web/src/app/page.tsx
"use client";

import { generateAuditPdf } from "./utils/generatePdf";
import { useState, useEffect } from "react";
import { runDocumentAuditAction, getAuditHistoryAction } from "./actions/audit";
import { AuditResult } from "@/types/audit";

interface FindingItem {
  rule: string;
  severity: string;
  reason: string;
}

interface AuditLogItem {
  id: string;
  documentId: string;
  filename: string;
  riskScore: number;
  status: string;
  findingsCount: number;
  processingTimeMs: number;
  findings?: FindingItem[];
  createdAt: Date | string;
}

export default function Dashboard() {
  const [filename, setFilename] = useState("vendor-contract.txt");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Past logs state saha Modal eke pennana select karapu row eka
  const [history, setHistory] = useState<AuditLogItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  async function loadHistory() {
    try {
      const logs = await getAuditHistoryAction();
      setHistory(logs as unknown as AuditLogItem[]);
    } catch (err) {
      console.error("Failed to load audit history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
    };

    reader.onerror = () => {
      setErrorMsg("File eka kiyawanna bari una. Karunakara aith try karanna.");
    };

    reader.readAsText(file);
  }

  async function handleAuditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    const res = await runDocumentAuditAction(filename, rawText);

    if (res.success) {
      setResult(res.data);
      await loadHistory();
    } else {
      setErrorMsg(res.error);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              OmniAudit AI <span className="text-sm font-normal text-slate-400">| Document Intelligence</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time automated compliance & risk audit powered by FastAPI Microservice & Neon PostgreSQL.
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleAuditSubmit} className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/60 space-y-4">
          {/* File Upload Selector */}
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center transition bg-slate-950/40">
            <label className="cursor-pointer block">
              <span className="text-sm font-medium text-slate-300 block mb-1">
                Upload Document File (.txt, .md, .json)
              </span>
              <span className="text-xs text-slate-500 block mb-3">
                File eka select karapu gaman auto text tika extract wela watenawa
              </span>
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={handleFileUpload}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Document Title / Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Paste Document Body Text for Audit
            </label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. This agreement is confidential under NDA. The client credit card and CVV are stored. Overdue penalty fees apply."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? <span>Auditing & Saving to Database...</span> : <span>Run Compliance Audit</span>}
          </button>
        </form>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-sm">
            <span className="font-semibold">Audit Error:</span> {errorMsg}
          </div>
        )}

        {/* Database Past Audits Table */}
        <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Audit Records (Neon PostgreSQL)</h2>
              <p className="text-xs text-slate-400">Click any row to view full findings report</p>
            </div>
            <button
              onClick={loadHistory}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <p className="text-sm text-slate-400">Loading audit history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">Thama audits kisiwak save wela naha.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-700/60 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5">File Name</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Risk Score</th>
                    <th className="py-2.5">Findings</th>
                    <th className="py-2.5">Latency</th>
                    <th className="py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {history.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-800/80 cursor-pointer transition"
                    >
                      <td className="py-3 font-medium text-white">{log.filename}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${log.status === "FLAGGED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                            }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3">{log.riskScore} / 100</td>
                      <td className="py-3">{log.findingsCount} issues</td>
                      <td className="py-3 text-slate-400">{log.processingTimeMs} ms</td>
                      <td className="py-3">
                        <span className="text-xs text-blue-400 hover:text-blue-300 font-medium">View Report &rarr;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Findings Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedLog.filename}</h3>
                  <p className="text-xs text-slate-400">Risk Score: {selectedLog.riskScore}/100 • Status: {selectedLog.status}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Detailed Violations ({selectedLog.findings?.length || 0})
                </h4>
                {!selectedLog.findings || selectedLog.findings.length === 0 ? (
                  <p className="text-sm text-slate-400">Me audit log eka parana nisa findings save wela naha. Aluth audit ekak karala balanna.</p>
                ) : (
                  selectedLog.findings.map((f, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-blue-400">{f.rule}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.severity === "CRITICAL"
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : f.severity === "HIGH"
                              ? "bg-orange-950 text-orange-300 border border-orange-800"
                              : "bg-yellow-950 text-yellow-300 border border-yellow-800"
                            }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{f.reason}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={() => selectedLog && generateAuditPdf(selectedLog)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1.5"
                >
                  <span>Download PDF Report</span>
                </button>

                {/* Modal Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}