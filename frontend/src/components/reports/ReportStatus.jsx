import { statusOf } from "../../lib/reports";

const STYLES = {
    ready: { label: "Ready", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
    pending: { label: "Generating", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500 animate-pulse" },
    failed: { label: "Failed", badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

const ReportStatus = ({ report }) => {
    const style = STYLES[statusOf(report)];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
};

export default ReportStatus;