import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    ShieldAlert,
    X,
} from "lucide-react";

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;

const TransactionDetailsModal = ({
    transaction,
    open,
    onClose,
    onCheckFraud,
    checkingFraud = false,
}) => {
    if (!open || !transaction) return null;

    const isIncome = transaction.type === "income";
    const fraudAlert = transaction.fraudAlert;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="font-bold text-gray-900">
                            Transaction Details
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            {transaction._id}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 p-6">
                    {/* Amount */}
                    <div
                        className={`rounded-2xl p-5 ${isIncome
                                ? "bg-emerald-50"
                                : "bg-red-50"
                            }`}
                    >
                        <p className="text-xs font-medium text-gray-500">
                            {isIncome ? "Income" : "Expense"}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                            {isIncome ? (
                                <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                            ) : (
                                <ArrowDownRight className="h-6 w-6 text-red-600" />
                            )}

                            <span
                                className={`text-3xl font-bold ${isIncome
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    }`}
                            >
                                {formatCurrency(transaction.amount)}
                            </span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Category
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {transaction.category || "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Type
                            </p>

                            <p className="mt-1 font-semibold capitalize text-gray-900">
                                {transaction.type || "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="flex items-center gap-1 text-xs text-gray-400">
                                <CalendarDays className="h-3 w-3" />
                                Date
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {transaction.date
                                    ? new Date(
                                        transaction.date
                                    ).toLocaleString("en-IN")
                                    : "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Description
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {transaction.description || "No description"}
                            </p>
                        </div>
                    </div>

                    {/* Fraud */}
                    {fraudAlert ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />

                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="font-bold text-red-800">
                                            Fraud Alert
                                        </h3>

                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                            {fraudAlert.status}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm text-red-700">
                                        Risk Score:{" "}
                                        <strong>
                                            {(
                                                Number(fraudAlert.riskScore || 0) *
                                                100
                                            ).toFixed(1)}
                                            %
                                        </strong>
                                    </p>

                                    {fraudAlert.reasons?.length > 0 && (
                                        <ul className="mt-3 space-y-1">
                                            {fraudAlert.reasons.map(
                                                (reason, index) => (
                                                    <li
                                                        key={index}
                                                        className="text-sm text-red-700"
                                                    >
                                                        • {reason}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-gray-400" />

                                <p className="text-sm text-gray-500">
                                    No fraud alert detected for this transaction.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Close
                        </button>

                        <button
                            type="button"
                            onClick={() => onCheckFraud(transaction._id)}
                            disabled={checkingFraud}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                        >
                            <ShieldAlert className="h-4 w-4" />

                            {checkingFraud
                                ? "Checking..."
                                : "Check Fraud"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailsModal;