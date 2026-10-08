import { useState } from "react";
import { Link } from "react-router-dom";

import { formatDateTime } from "../../lib/format";
import { createdAt, deleteReport, typeMeta } from "../../lib/reports";
import DownloadButton from "./DownloadButton";
import ReportStatus from "./ReportStatus";

const ReportsTable = ({ reports, onChanged }) => {
    const [confirmId, setConfirmId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);

    const handleDelete = async (id) => {
        setDeletingId(id);
        setError(null);
        try {
            await deleteReport(id);
            setConfirmId(null);
            onChanged?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            {error && (
                <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="overflow-x-auto">
                <table className="w-full min-w-160 text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-500">
                            <th className="pb-3 font-medium">Report</th>
                            <th className="pb-3 font-medium">Generated</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {reports.map((report) => {
                            const meta = typeMeta(report.type);
                            const Icon = meta.icon;
                            const confirming = confirmId === report.id;

                            return (
                                <tr key={report.id}>
                                    <td className="py-3">
                                        <Link to={`/reports/${report.id}`} className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                                                <Icon size={17} />
                                            </span>
                                            <span>
                                                <span className="block font-medium text-gray-900 hover:text-indigo-600">
                                                    {meta.label}
                                                </span>
                                                <span className="block text-xs text-gray-500">#{report.id}</span>
                                            </span>
                                        </Link>
                                    </td>

                                    <td className="py-3 text-gray-500">{formatDateTime(createdAt(report))}</td>

                                    <td className="py-3">
                                        <ReportStatus report={report} />
                                    </td>

                                    <td className="py-3">
                                        <div className="flex items-start justify-end gap-2">
                                            {confirming ? (
                                                <>
                                                    <span className="self-center text-xs text-gray-500">Delete this report?</span>
                                                    <button
                                                        onClick={() => handleDelete(report.id)}
                                                        disabled={deletingId === report.id}
                                                        className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {deletingId === report.id ? "Deleting…" : "Delete"}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmId(null)}
                                                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <DownloadButton report={report} />
                                                    <button
                                                        onClick={() => setConfirmId(report.id)}
                                                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ReportsTable;