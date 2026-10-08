import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import DownloadButton from "../../components/reports/DownloadButton";
import ReportStatus from "../../components/reports/ReportStatus";
import { Card, EmptyState, InlineError, Skeleton } from "../../components/ui/primitives";

import { useReport } from "../../hooks/useReports";
import { formatDate, formatDateTime } from "../../lib/format";
import { createdAt, deleteReport, statusOf, typeMeta } from "../../lib/reports";

const Detail = ({ label, children }) => (
    <div>
        <dt className="text-xs font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-gray-900">{children}</dd>
    </div>
);

const ReportDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: report, loading, error, refetch } = useReport(id);

    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteReport(id);
            navigate("/reports");
        } catch (e) {
            setDeleteError(e.message);
            setDeleting(false);
        }
    };

    const meta = report ? typeMeta(report.type) : null;
    const status = report ? statusOf(report) : null;
    const from = report?.from ?? report?.period_start;
    const to = report?.to ?? report?.period_end;

    return (
        <div className="mx-auto max-w-200">
            <Link
                to="/reports"
                className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
            >
                <ArrowLeft size={15} />
                All reports
            </Link>

            {loading ? (
                <Skeleton className="h-72 w-full" />
            ) : error && !report ? (
                error.status === 404 ? (
                    <EmptyState title="Report not found" message="It may have been deleted. Head back to your reports to generate a new one." />
                ) : (
                    <InlineError error={error} onRetry={refetch} />
                )
            ) : (
                report && (
                    <Card>
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <meta.icon size={22} />
                                </span>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">{meta.label}</h1>
                                    {meta.description && (
                                        <p className="mt-1 max-w-md text-sm text-gray-500">{meta.description}</p>
                                    )}
                                </div>
                            </div>

                            <ReportStatus report={report} />
                        </div>

                        <dl className="mt-8 grid gap-6 border-t border-gray-100 pt-6 sm:grid-cols-3">
                            <Detail label="Generated">{formatDateTime(createdAt(report))}</Detail>
                            <Detail label="Period">
                                {from && to
                                    ? `${formatDate(from, { day: "numeric", month: "short", year: "numeric" })} – ${formatDate(to, { day: "numeric", month: "short", year: "numeric" })}`
                                    : "—"}
                            </Detail>
                            <Detail label="Report ID">#{report.id}</Detail>
                        </dl>

                        {status === "pending" && (
                            <p role="status" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                We're still building this report. This page updates by itself, so you can leave it open.
                            </p>
                        )}

                        {status === "failed" && (
                            <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                This report couldn't be generated. Delete it and generate a new one from the Reports page.
                            </p>
                        )}

                        {deleteError && (
                            <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-8 flex flex-wrap items-start gap-3 border-t border-gray-100 pt-6">
                            <DownloadButton report={report} variant="primary" />

                            {confirming ? (
                                <>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {deleting ? "Deleting…" : "Yes, delete report"}
                                    </button>
                                    <button
                                        onClick={() => setConfirming(false)}
                                        disabled={deleting}
                                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setConfirming(true)}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    Delete report
                                </button>
                            )}
                        </div>
                    </Card>
                )
            )}
        </div>
    );
};

export default ReportDetailPage;