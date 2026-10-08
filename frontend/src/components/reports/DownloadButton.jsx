import { useState } from "react";
import { Download } from "lucide-react";
import { downloadReport, statusOf } from "../../lib/reports";

const VARIANTS = {
    primary: "bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700",
    ghost: "border border-gray-200 px-3 py-1.5 text-gray-700 hover:bg-gray-50",
};

const DownloadButton = ({ report, variant = "ghost" }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const ready = statusOf(report) === "ready";

    const handleClick = async () => {
        setBusy(true);
        setError(null);
        try {
            await downloadReport(report);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="inline-block">
            <button
                onClick={handleClick}
                disabled={!ready || busy}
                title={ready ? "Download report" : "Available once the report is ready"}
                className={`inline-flex items-center gap-1.5 rounded-xl text-sm font-medium disabled:opacity-40 ${VARIANTS[variant]}`}
            >
                <Download size={15} />
                {busy ? "Downloading…" : "Download"}
            </button>
            {error && <p className="mt-1 max-w-55 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default DownloadButton;