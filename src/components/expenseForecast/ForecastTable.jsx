import {
    CalendarDays,
    IndianRupee,
} from "lucide-react";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
};

const formatMonth = (month) => {
    if (!month) return "-";

    const date = new Date(`${month}-01`);

    if (Number.isNaN(date.getTime())) {
        return month;
    }

    return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });
};

const ForecastTable = ({ forecasts }) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <IndianRupee size={18} />
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Forecast Details
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Category-wise predicted expenses.
                        </p>
                    </div>
                </div>
            </div>

            {!forecasts.length ? (
                <div className="px-5 py-14 text-center">
                    <p className="font-medium text-slate-700">
                        No forecasts found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Generate a forecast or change your filters.
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
                                        Month
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Category
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Predicted Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {forecasts.map((forecast) => (
                                    <tr
                                        key={forecast._id}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <CalendarDays
                                                    size={15}
                                                    className="text-slate-400"
                                                />

                                                {formatMonth(
                                                    forecast.month
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                {forecast.category}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                                            {formatCurrency(
                                                forecast.predictedAmount
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {forecasts.map((forecast) => (
                            <div
                                key={forecast._id}
                                className="p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {forecast.category}
                                        </p>

                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                            <CalendarDays size={13} />
                                            {formatMonth(
                                                forecast.month
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm font-bold text-slate-900">
                                        {formatCurrency(
                                            forecast.predictedAmount
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ForecastTable;