import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    IndianRupee,
    ShieldCheck,
} from "lucide-react";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
};

const formatDate = (date) => {
    if (!date) {
        return "-";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getStatusConfig = (status) => {
    switch (status) {
        case "CONFIRMED":
            return {
                label: "Confirmed",
                className:
                    "bg-red-50 text-red-700 border-red-100",
                icon: AlertTriangle,
            };

        case "REVIEWED":
            return {
                label: "Reviewed",
                className:
                    "bg-blue-50 text-blue-700 border-blue-100",
                icon: CheckCircle2,
            };

        case "DISMISSED":
            return {
                label: "Dismissed",
                className:
                    "bg-emerald-50 text-emerald-700 border-emerald-100",
                icon: ShieldCheck,
            };

        case "PENDING":
        default:
            return {
                label: "Pending",
                className:
                    "bg-amber-50 text-amber-700 border-amber-100",
                icon: Clock3,
            };
    }
};

const FraudAlertCard = ({
    alert,
    onView,
}) => {
    const status = getStatusConfig(
        alert.status
    );

    const StatusIcon = status.icon;

    const transaction =
        alert.transactionId || {};

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex flex-col gap-4">
                {/* Top */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <AlertTriangle size={20} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-900">
                                Suspicious Transaction
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                Alert ID: {alert._id}
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                        <StatusIcon size={13} />

                        {status.label}
                    </span>
                </div>

                {/* Transaction */}
                <div className="rounded-xl bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-slate-400">
                                Amount
                            </p>

                            <div className="mt-1 flex items-center gap-1 text-lg font-bold text-slate-900">
                                <IndianRupee size={16} />

                                {Number(
                                    transaction.amount || 0
                                ).toLocaleString("en-IN")}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400">
                                Date
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <CalendarDays size={15} />

                                {formatDate(
                                    transaction.date
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400">
                                Description
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-slate-700">
                                {transaction.description ||
                                    "No description"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400">
                        Created{" "}
                        {formatDate(alert.createdAt)}
                    </p>

                    <button
                        onClick={() => onView(alert)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Review Alert

                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FraudAlertCard;