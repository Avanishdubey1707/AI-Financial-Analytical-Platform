import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    IndianRupee,
    ShieldCheck,
    X,
} from "lucide-react";

const STATUSES = [
    {
        value: "PENDING",
        label: "Pending",
        icon: Clock3,
    },
    {
        value: "REVIEWED",
        label: "Reviewed",
        icon: CheckCircle2,
    },
    {
        value: "CONFIRMED",
        label: "Confirmed Fraud",
        icon: AlertTriangle,
    },
    {
        value: "DISMISSED",
        label: "Dismissed",
        icon: ShieldCheck,
    },
];

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

    return parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const FraudAlertDetailsModal = ({
    open,
    alert,
    loading,
    onClose,
    onStatusChange,
}) => {
    if (!open || !alert) {
        return null;
    }

    const transaction =
        alert.transaction ||
        alert.transactionId ||
        {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <ShieldCheck size={19} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Fraud Alert Details
                            </h2>

                            <p className="mt-1 text-xs text-slate-400">
                                Review the suspicious transaction.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-5 p-5">
                    {/* Warning */}
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <div className="flex gap-3">
                            <AlertTriangle
                                size={19}
                                className="mt-0.5 shrink-0 text-red-600"
                            />

                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    Suspicious transaction detected
                                </p>

                                <p className="mt-1 text-xs leading-5 text-red-600">
                                    Review the transaction details below and
                                    decide whether this alert should be
                                    confirmed, reviewed or dismissed.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction information */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Transaction
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-400">
                                    Amount
                                </p>

                                <div className="mt-1 flex items-center gap-1 text-lg font-bold text-slate-900">
                                    <IndianRupee size={17} />

                                    {formatCurrency(
                                        transaction.amount
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-400">
                                    Date
                                </p>

                                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <CalendarDays size={15} />

                                    {formatDate(
                                        transaction.date
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                                <p className="text-xs text-slate-400">
                                    Description
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {transaction.description ||
                                        "No description available"}
                                </p>
                            </div>

                            {transaction.category && (
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs text-slate-400">
                                        Category
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {transaction.category}
                                    </p>
                                </div>
                            )}

                            {transaction.type && (
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs text-slate-400">
                                        Type
                                    </p>

                                    <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                                        {transaction.type}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alert status */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Update Status
                        </h3>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {STATUSES.map((item) => {
                                const Icon = item.icon;

                                const active =
                                    alert.status === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        onClick={() =>
                                            onStatusChange(
                                                alert._id,
                                                item.value
                                            )
                                        }
                                        disabled={loading}
                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                        <Icon size={17} />

                                        <div>
                                            <p className="text-sm font-semibold">
                                                {item.label}
                                            </p>

                                            {active && (
                                                <p className="mt-0.5 text-[11px] text-slate-300">
                                                    Current status
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                            Alert ID
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-slate-600">
                            {alert._id}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                            Created
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                            {formatDate(alert.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FraudAlertDetailsModal;