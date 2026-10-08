import { Filter, RotateCcw, Search } from "lucide-react";

const TransactionFilters = ({
    filters,
    setFilters,
    onApply,
    onClear,
}) => {
    const updateFilter = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    return (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />

                <h2 className="text-sm font-semibold text-gray-800">
                    Transaction Filters
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {/* Search */}
                <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) =>
                            updateFilter("search", e.target.value)
                        }
                        placeholder="Search description..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

                {/* Type */}
                <select
                    value={filters.type}
                    onChange={(e) =>
                        updateFilter("type", e.target.value)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
                >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>

                {/* Category */}
                <input
                    type="text"
                    value={filters.category}
                    onChange={(e) =>
                        updateFilter("category", e.target.value)
                    }
                    placeholder="Category"
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />

                {/* From */}
                <input
                    type="date"
                    value={filters.from}
                    onChange={(e) =>
                        updateFilter("from", e.target.value)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
                />

                {/* To */}
                <input
                    type="date"
                    value={filters.to}
                    onChange={(e) =>
                        updateFilter("to", e.target.value)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
                />

                {/* Min */}
                <input
                    type="number"
                    min="0"
                    value={filters.minAmount}
                    onChange={(e) =>
                        updateFilter("minAmount", e.target.value)
                    }
                    placeholder="Min amount"
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />

                {/* Max */}
                <input
                    type="number"
                    min="0"
                    value={filters.maxAmount}
                    onChange={(e) =>
                        updateFilter("maxAmount", e.target.value)
                    }
                    placeholder="Max amount"
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />

                {/* Sort */}
                <select
                    value={filters.sortBy}
                    onChange={(e) =>
                        updateFilter("sortBy", e.target.value)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
                >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
                    <option value="type">Type</option>
                </select>

                {/* Order */}
                <select
                    value={filters.order}
                    onChange={(e) =>
                        updateFilter("order", e.target.value)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onApply}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                    <Filter className="h-4 w-4" />
                    Apply Filters
                </button>

                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                </button>
            </div>
        </div>
    );
};

export default TransactionFilters;