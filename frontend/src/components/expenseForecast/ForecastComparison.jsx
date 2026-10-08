import {
    ArrowDownRight,
    ArrowUpRight,
    Target,
} from "lucide-react";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

const ForecastComparison = ({
    comparison,
    month,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Target size={18} />
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Forecast vs Actual
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            See how your actual spending compares with
                            the AI prediction.
                        </p>
                    </div>
                </div>

                {month && (
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {month}
                    </span>
                )}
            </div>

            {!comparison.length ? (
                <div className="px-5 py-14 text-center">
                    <p className="font-medium text-slate-700">
                        No comparison data
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Select a month with forecast data to see the
                        comparison.
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Category
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Predicted
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Actual
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Variance
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {comparison.map((item) => {
                                    const positive =
                                        Number(item.variance || 0) > 0;

                                    return (
                                        <tr
                                            key={item.category}
                                            className="border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-slate-800">
                                                    {item.category}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right text-sm text-slate-600">
                                                {formatCurrency(
                                                    item.predictedAmount
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right text-sm font-medium text-slate-800">
                                                {formatCurrency(
                                                    item.actualAmount
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div
                                                    className={`inline-flex items-center gap-1 text-sm font-semibold ${positive
                                                            ? "text-red-600"
                                                            : "text-emerald-600"
                                                        }`}
                                                >
                                                    {positive ? (
                                                        <ArrowUpRight
                                                            size={15}
                                                        />
                                                    ) : (
                                                        <ArrowDownRight
                                                            size={15}
                                                        />
                                                    )}

                                                    {formatCurrency(
                                                        Math.abs(
                                                            item.variance || 0
                                                        )
                                                    )}
                                                </div>

                                                {item.variancePercent !==
                                                    null &&
                                                    item.variancePercent !==
                                                    undefined && (
                                                        <p
                                                            className={`mt-0.5 text-xs ${positive
                                                                    ? "text-red-500"
                                                                    : "text-emerald-500"
                                                                }`}
                                                        >
                                                            {positive ? "+" : ""}
                                                            {Number(
                                                                item.variancePercent
                                                            ).toFixed(1)}
                                                            %
                                                        </p>
                                                    )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {comparison.map((item) => {
                            const positive =
                                Number(item.variance || 0) > 0;

                            return (
                                <div
                                    key={item.category}
                                    className="p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-900">
                                            {item.category}
                                        </p>

                                        <div
                                            className={`flex items-center gap-1 text-sm font-semibold ${positive
                                                    ? "text-red-600"
                                                    : "text-emerald-600"
                                                }`}
                                        >
                                            {positive ? (
                                                <ArrowUpRight size={14} />
                                            ) : (
                                                <ArrowDownRight size={14} />
                                            )}

                                            {formatCurrency(
                                                Math.abs(
                                                    item.variance || 0
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-slate-50 p-3">
                                            <p className="text-xs text-slate-400">
                                                Predicted
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {formatCurrency(
                                                    item.predictedAmount
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-slate-50 p-3">
                                            <p className="text-xs text-slate-400">
                                                Actual
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {formatCurrency(
                                                    item.actualAmount
                                                )}
                                            </p>
                                        </div>
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

export default ForecastComparison;