import { FileText, PieChart, Receipt, ShieldAlert, Wallet } from "lucide-react";
import { api, downloadFile } from "./api";

/*
 * Endpoints used:
 *   GET    /reports                 -> [{ id, type, status?, created_at, file_url }]
 *   POST   /reports/generate        -> body { type, from, to } -> the created report
 *   GET    /reports/:id             -> report metadata
 *   GET    /reports/:id/download    -> the file (streamed)
 *   DELETE /reports/:id
 */

export const REPORT_TYPES = [
    {
        value: "portfolio_summary",
        label: "Portfolio summary",
        description: "Holdings, current value and gain or loss across your portfolios.",
        icon: PieChart,
    },
    {
        value: "expense",
        label: "Expense report",
        description: "Where your money went, grouped by category and month.",
        icon: Wallet,
    },
    {
        value: "fraud",
        label: "Fraud report",
        description: "Flagged transactions, their risk scores and how you handled them.",
        icon: ShieldAlert,
    },
    {
        value: "tax",
        label: "Tax report",
        description: "Realised gains and losses for filing.",
        icon: Receipt,
    },
];

const titleCase = (s = "") =>
    s
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const typeMeta = (type) =>
    REPORT_TYPES.find((t) => t.value === type) ?? {
        value: type,
        label: titleCase(type) || "Report",
        description: "",
        icon: FileText,
    };

const PENDING = ["pending", "processing", "queued", "generating", "running"];
const FAILED = ["failed", "error"];

// Normalises whatever status string the backend uses into: ready | pending | failed
export const statusOf = (report) => {
    const s = String(report?.status ?? "").toLowerCase();
    if (PENDING.includes(s)) return "pending";
    if (FAILED.includes(s)) return "failed";
    return "ready";
};

export const createdAt = (report) => report?.created_at ?? report?.generated_at;

/* ---------- Reporting periods ---------- */

export const PERIODS = [
    { value: "this_month", label: "This month" },
    { value: "last_month", label: "Last month" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "year_to_date", label: "Year to date" },
    { value: "custom", label: "Custom range" },
];

const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function periodToRange(period) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    switch (period) {
        case "this_month":
            return { from: iso(new Date(y, m, 1)), to: iso(now) };
        case "last_month":
            return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
        case "last_3_months":
            return { from: iso(new Date(y, m - 3, now.getDate())), to: iso(now) };
        case "year_to_date":
            return { from: iso(new Date(y, 0, 1)), to: iso(now) };
        default:
            return { from: "", to: "" };
    }
}

/* ---------- API calls ---------- */

export const generateReport = ({ type, from, to }) =>
    api.post("/reports/generate", { type, from, to });

export const deleteReport = (id) => api.del(`/reports/${id}`);

export const downloadReport = (report) =>
    downloadFile(`/reports/${report.id}/download`, `${report.type ?? "report"}-${report.id}`);