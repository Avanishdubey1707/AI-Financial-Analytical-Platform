import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

const EMPTY_FORM = {
    type: "expense",
    amount: "",
    category: "",
    description: "",
};

const TransactionFormModal = ({
    open,
    transaction,
    onClose,
    onSubmit,
    submitting = false,
}) => {
    const [form, setForm] = useState(EMPTY_FORM);

    const isEditing = Boolean(transaction);

    useEffect(() => {
        if (transaction) {
            setForm({
                type: transaction.type || "expense",
                amount: transaction.amount ?? "",
                category: transaction.category || "",
                description: transaction.description || "",
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [transaction, open]);

    if (!open) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            type: form.type,
            amount: Number(form.amount),
            category: form.category.trim(),
            description: form.description.trim(),
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !submitting
                ) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="font-bold text-gray-900">
                            {isEditing
                                ? "Edit Transaction"
                                : "Add Transaction"}
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            {isEditing
                                ? "Update transaction details"
                                : "Record a new income or expense"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 p-6"
                >
                    {!isEditing && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Type
                            </label>

                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Amount
                        </label>

                        <input
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            required
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Category
                        </label>

                        <input
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            placeholder="e.g. Food, Salary, Travel"
                            required
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Optional description"
                            rows={3}
                            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {submitting && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            {submitting
                                ? "Saving..."
                                : isEditing
                                    ? "Update Transaction"
                                    : "Add Transaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionFormModal;