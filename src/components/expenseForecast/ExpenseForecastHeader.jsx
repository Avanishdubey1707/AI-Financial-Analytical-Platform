import {
    Brain,
    RefreshCw,
    Sparkles,
} from "lucide-react";

const ExpenseForecastHeader = ({
    onGenerate,
    onRefresh,
    loading,
}) => {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                        <Brain size={21} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Expense Forecast
                            </h1>

                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                                <Sparkles size={12} />
                                AI Powered
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Predict your future spending using your
                            transaction history.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />

                    Refresh
                </button>

                <button
                    onClick={onGenerate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Sparkles size={16} />

                    Generate Forecast
                </button>
            </div>
        </div>
    );
};

export default ExpenseForecastHeader;