import {
    Plus,
    RefreshCw,
    ReceiptIndianRupee,
} from "lucide-react";

const TransactionHeader = ({
    onAdd,
    onRefresh,
    loading = false,
}) => {
    return (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                    <ReceiptIndianRupee className="h-6 w-6 text-indigo-600" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Transactions
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Track your income, expenses, and suspicious transactions.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""
                            }`}
                    />
                    Refresh
                </button>

                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Transaction
                </button>
            </div>
        </div>
    );
};

export default TransactionHeader;