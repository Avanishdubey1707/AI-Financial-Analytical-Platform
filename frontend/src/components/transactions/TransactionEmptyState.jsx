import { ReceiptIndianRupee } from "lucide-react";

const TransactionEmptyState = ({ onAdd }) => {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <ReceiptIndianRupee className="h-8 w-8 text-indigo-600" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
                No transactions found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Start tracking your income and expenses by adding
                your first transaction.
            </p>

            <button
                type="button"
                onClick={onAdd}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
                Add Transaction
            </button>
        </div>
    );
};

export default TransactionEmptyState;