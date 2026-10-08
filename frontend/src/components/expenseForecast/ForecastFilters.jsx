import { CalendarDays, Filter, X } from "lucide-react";

const ForecastFilters = ({
    month,
    category,
    onMonthChange,
    onCategoryChange,
    categories,
    onClear,
}) => {
    const hasFilters = month || category;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex items-center gap-2 lg:mr-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Filter size={16} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Filters
                        </p>

                        <p className="text-xs text-slate-400">
                            Narrow down your forecasts
                        </p>
                    </div>
                </div>

                <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        Forecast Month
                    </label>

                    <div className="relative">
                        <CalendarDays
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="month"
                            value={month}
                            onChange={(e) =>
                                onMonthChange(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>
                </div>

                <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        Category
                    </label>

                    <select
                        value={category}
                        onChange={(e) =>
                            onCategoryChange(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    >
                        <option value="">All Categories</option>

                        {categories.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                {hasFilters && (
                    <button
                        onClick={onClear}
                        className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <X size={15} />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default ForecastFilters;