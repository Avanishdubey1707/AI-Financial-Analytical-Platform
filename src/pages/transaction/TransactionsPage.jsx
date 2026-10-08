import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import {
    addTransaction,
    checkTransactionFraud,
    deleteTransaction,
    getTransactionById,
    getTransactionSummary,
    getTransactions,
    updateTransaction,
} from "../../api/transactionApi";

import TransactionHeader from "../../components/transactions/TransactionHeader";
import TransactionFilters from "../../components/transactions/TransactionFilters";
import TransactionStats from "../../components/transactions/TransactionStats";
import TransactionList from "../../components/transactions/TransactionList";
import TransactionFormModal from "../../components/transactions/TransactionFormModal";
import TransactionDetailsModal from "../../components/transactions/TransactionDetailsModal";
import TransactionEmptyState from "../../components/transactions/TransactionEmptyState";

const DEFAULT_FILTERS = {
    type: "",
    category: "",
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    search: "",
    sortBy: "date",
    order: "desc",
};

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] =
        useState(DEFAULT_FILTERS);

    const [overallTotals, setOverallTotals] = useState({});

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [checkingFraud, setCheckingFraud] = useState(false);

    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const [editingTransaction, setEditingTransaction] =
        useState(null);

    const [selectedTransaction, setSelectedTransaction] =
        useState(null);

    const loadTransactions = useCallback(
        async (page = 1) => {
            try {
                setLoading(true);
                setError("");

                const params = {
                    page,
                    limit: 20,
                    sortBy: appliedFilters.sortBy,
                    order: appliedFilters.order,
                };

                Object.entries(appliedFilters).forEach(
                    ([key, value]) => {
                        if (
                            value !== "" &&
                            key !== "sortBy" &&
                            key !== "order"
                        ) {
                            params[key] = value;
                        }
                    }
                );

                const response = await getTransactions(params);

                const data = response?.data || {};

                setTransactions(data.transactions || []);

                setPagination(
                    data.pagination || {
                        page,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                    }
                );
            } catch (err) {
                console.error(
                    "Failed to load transactions:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    "Unable to load transactions."
                );
            } finally {
                setLoading(false);
            }
        },
        [appliedFilters]
    );

    const loadSummary = useCallback(async () => {
        try {
            const params = {};

            if (appliedFilters.from) {
                params.from = appliedFilters.from;
            }

            if (appliedFilters.to) {
                params.to = appliedFilters.to;
            }

            const response = await getTransactionSummary(params);

            const data = response?.data || {};

            setOverallTotals(data.overallTotals || {});
        } catch (err) {
            console.error(
                "Failed to load transaction summary:",
                err
            );
        }
    }, [appliedFilters]);

    useEffect(() => {
        loadTransactions(1);
        loadSummary();
    }, [loadTransactions, loadSummary]);

    const handleApplyFilters = () => {
        setAppliedFilters({
            ...filters,
        });
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
    };

    const handleAdd = () => {
        setEditingTransaction(null);
        setFormOpen(true);
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setFormOpen(true);
    };

    const handleSubmit = async (data) => {
        try {
            setSubmitting(true);
            setError("");

            if (editingTransaction) {
                await updateTransaction(
                    editingTransaction._id,
                    {
                        amount: data.amount,
                        category: data.category,
                        description: data.description,
                    }
                );
            } else {
                await addTransaction(data);
            }

            setFormOpen(false);
            setEditingTransaction(null);

            await Promise.all([
                loadTransactions(pagination.page),
                loadSummary(),
            ]);
        } catch (err) {
            console.error(
                "Failed to save transaction:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to save transaction."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = async (id) => {
        try {
            setDetailsLoading(true);
            setError("");

            const response = await getTransactionById(id);

            const data = response?.data || {};

            if (!data.transaction) {
                throw new Error(
                    "Transaction details were not returned."
                );
            }

            setSelectedTransaction({
                ...data.transaction,
                fraudAlert: data.fraudAlert || null,
            });

            setDetailsOpen(true);
        } catch (err) {
            console.error(
                "Failed to load transaction:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to load transaction details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDelete = async (transaction) => {
        const confirmed = window.confirm(
            `Delete this ${transaction.type} transaction of ₹${Number(
                transaction.amount
            ).toLocaleString("en-IN")}?`
        );

        if (!confirmed) return;

        try {
            setError("");

            await deleteTransaction(transaction._id);

            await Promise.all([
                loadTransactions(
                    transactions.length === 1 && pagination.page > 1
                        ? pagination.page - 1
                        : pagination.page
                ),
                loadSummary(),
            ]);
        } catch (err) {
            console.error(
                "Failed to delete transaction:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to delete transaction."
            );
        }
    };

    const handleCheckFraud = async (id) => {
        try {
            setCheckingFraud(true);
            setError("");

            const response = await checkTransactionFraud(id);

            const fraudAlert =
                response?.data?.fraudAlert || null;

            setSelectedTransaction((previous) =>
                previous
                    ? {
                        ...previous,
                        fraudAlert,
                    }
                    : previous
            );

            await loadTransactions(pagination.page);
        } catch (err) {
            console.error(
                "Fraud check failed:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to check fraud."
            );
        } finally {
            setCheckingFraud(false);
        }
    };

    const totalPages = pagination.totalPages || 1;

    return (
        <div className="min-h-full bg-[#f7f8fa] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <TransactionHeader
                    onAdd={handleAdd}
                    onRefresh={() =>
                        Promise.all([
                            loadTransactions(pagination.page),
                            loadSummary(),
                        ])
                    }
                    loading={loading}
                />

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                Something went wrong
                            </p>

                            <p className="mt-1 text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                <TransactionFilters
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                />

                {loading ? (
                    <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

                            <p className="text-sm text-gray-500">
                                Loading transactions...
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <TransactionStats
                            transactions={transactions}
                            overallTotals={overallTotals}
                        />

                        {transactions.length > 0 ? (
                            <>
                                <TransactionList
                                    transactions={transactions}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <p className="text-sm text-gray-500">
                                            Page{" "}
                                            <strong className="text-gray-900">
                                                {pagination.page}
                                            </strong>{" "}
                                            of{" "}
                                            <strong className="text-gray-900">
                                                {totalPages}
                                            </strong>
                                        </p>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={pagination.page <= 1}
                                                onClick={() =>
                                                    loadTransactions(
                                                        pagination.page - 1
                                                    )
                                                }
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Previous
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    pagination.page >= totalPages
                                                }
                                                onClick={() =>
                                                    loadTransactions(
                                                        pagination.page + 1
                                                    )
                                                }
                                                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <TransactionEmptyState onAdd={handleAdd} />
                        )}
                    </>
                )}

                <TransactionFormModal
                    open={formOpen}
                    transaction={editingTransaction}
                    onClose={() => {
                        if (!submitting) {
                            setFormOpen(false);
                            setEditingTransaction(null);
                        }
                    }}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />

                <TransactionDetailsModal
                    open={detailsOpen}
                    transaction={selectedTransaction}
                    onClose={() => setDetailsOpen(false)}
                    onCheckFraud={handleCheckFraud}
                    checkingFraud={checkingFraud}
                />

                {detailsLoading && (
                    <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading transaction...
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;