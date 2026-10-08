import {
    Edit3,
    Plus,
    Trash2,
} from "lucide-react";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
};

const HoldingsTable = ({
    holdings,
    onAddHolding,
    onEditHolding,
    onDeleteHolding,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-semibold text-slate-900">
                        Holdings
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Assets currently held in this portfolio.
                    </p>
                </div>

                <button
                    onClick={onAddHolding}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                    <Plus size={16} />
                    Add Holding
                </button>
            </div>

            {!holdings?.length ? (
                <div className="px-5 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Plus size={20} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-800">
                        No holdings yet
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                        Add your first stock holding to start tracking
                        your portfolio.
                    </p>

                    <button
                        onClick={onAddHolding}
                        className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        Add your first holding →
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Asset
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Quantity
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Avg. Price
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Current Price
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Market Value
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Return
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {holdings.map((holding) => {
                                    const gainLoss =
                                        holding.gainLoss || 0;

                                    const gainLossPercent =
                                        holding.gainLossPercent || 0;

                                    const positive = gainLoss >= 0;

                                    return (
                                        <tr
                                            key={holding._id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                        >
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {holding.stockSymbol}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        Stock
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                                                {holding.quantity}
                                            </td>

                                            <td className="px-5 py-4 text-right text-sm text-slate-600">
                                                {formatCurrency(
                                                    holding.avgPrice
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                                                {formatCurrency(
                                                    holding.currentPrice
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                                                {formatCurrency(
                                                    holding.marketValue
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div
                                                    className={`text-sm font-semibold ${positive
                                                            ? "text-emerald-600"
                                                            : "text-red-600"
                                                        }`}
                                                >
                                                    {positive ? "+" : ""}
                                                    {formatCurrency(gainLoss)}
                                                </div>

                                                <div
                                                    className={`mt-0.5 text-xs ${positive
                                                            ? "text-emerald-500"
                                                            : "text-red-500"
                                                        }`}
                                                >
                                                    {positive ? "+" : ""}
                                                    {gainLossPercent.toFixed(2)}%
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() =>
                                                            onEditHolding(holding)
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            onDeleteHolding(holding)
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {holdings.map((holding) => {
                            const gainLoss =
                                holding.gainLoss || 0;

                            const gainLossPercent =
                                holding.gainLossPercent || 0;

                            const positive = gainLoss >= 0;

                            return (
                                <div
                                    key={holding._id}
                                    className="p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {holding.stockSymbol}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {holding.quantity} shares
                                            </p>
                                        </div>

                                        <div
                                            className={`text-right text-sm font-semibold ${positive
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                                }`}
                                        >
                                            {positive ? "+" : ""}
                                            {gainLossPercent.toFixed(2)}%
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Avg. Price
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {formatCurrency(
                                                    holding.avgPrice
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Current Price
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {formatCurrency(
                                                    holding.currentPrice
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Market Value
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                {formatCurrency(
                                                    holding.marketValue
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Gain/Loss
                                            </p>

                                            <p
                                                className={`mt-1 text-sm font-semibold ${positive
                                                        ? "text-emerald-600"
                                                        : "text-red-600"
                                                    }`}
                                            >
                                                {positive ? "+" : ""}
                                                {formatCurrency(gainLoss)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            onClick={() =>
                                                onEditHolding(holding)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
                                        >
                                            <Edit3 size={14} />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                onDeleteHolding(holding)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default HoldingsTable;