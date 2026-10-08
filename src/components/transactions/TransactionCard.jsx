import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    Pencil,
    ShieldAlert,
    Trash2,
} from "lucide-react";

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;

const TransactionCard = ({
    transaction,
    onView,
    onEdit,
    onDelete,
}) => {
    const isIncome = transaction.type === "income";
    const fraudAlert = transaction.fraudAlert;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isIncome
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                            }`}
                    >
                        {isIncome ? (
                            <ArrowUpRight className="h-5 w-5" />
                        ) : (
                            <ArrowDownRight className="h-5 w-5" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                            {transaction.category || "Uncategorized"}
                        </h3>

                        <p className="mt-1 truncate text-sm text-gray-500">
                            {transaction.description || "No description"}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p
                        className={`whitespace-nowrap text-lg font-bold ${isIncome
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                    >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                    </p>

                    <span className="text-xs capitalize text-gray-400">
                        {transaction.type}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />

                    {transaction.date
                        ? new Date(transaction.date).toLocaleDateString(
                            "en-IN"
                        )
                        : "—"}
                </div>

                {fraudAlert && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <ShieldAlert className="h-3 w-3" />
                        Fraud Alert
                    </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onView(transaction._id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Edit"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(transaction)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionCard;