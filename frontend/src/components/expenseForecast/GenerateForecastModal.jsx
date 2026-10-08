import { useState } from "react";
import {
    Brain,
    X,
} from "lucide-react";

const GenerateForecastModal = ({
    open,
    onClose,
    onSubmit,
    loading,
}) => {
    const [monthsOfHistory, setMonthsOfHistory] =
        useState(12);

    const [monthsToForecast, setMonthsToForecast] =
        useState(1);

    if (!open) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        await onSubmit({
            monthsOfHistory: Number(monthsOfHistory),
            monthsToForecast: Number(monthsToForecast),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Brain size={19} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Generate AI Forecast
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Configure your forecasting window.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 p-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Transaction History
                            </label>

                            <p className="mt-1 text-xs text-slate-400">
                                How many months of historical expenses
                                should the AI use?
                            </p>

                            <select
                                value={monthsOfHistory}
                                onChange={(e) =>
                                    setMonthsOfHistory(e.target.value)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            >
                                <option value={3}>
                                    Last 3 months
                                </option>

                                <option value={6}>
                                    Last 6 months
                                </option>

                                <option value={12}>
                                    Last 12 months
                                </option>

                                <option value={18}>
                                    Last 18 months
                                </option>

                                <option value={24}>
                                    Last 24 months
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Forecast Period
                            </label>

                            <p className="mt-1 text-xs text-slate-400">
                                How many future months should be
                                predicted?
                            </p>

                            <select
                                value={monthsToForecast}
                                onChange={(e) =>
                                    setMonthsToForecast(e.target.value)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            >
                                <option value={1}>
                                    Next 1 month
                                </option>

                                <option value={2}>
                                    Next 2 months
                                </option>

                                <option value={3}>
                                    Next 3 months
                                </option>

                                <option value={6}>
                                    Next 6 months
                                </option>
                            </select>
                        </div>

                        <div className="rounded-xl bg-indigo-50 p-4">
                            <p className="text-xs leading-5 text-indigo-700">
                                The AI will analyze your historical
                                expense transactions and generate
                                category-wise spending predictions.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Brain size={16} />

                            {loading
                                ? "Generating..."
                                : "Generate Forecast"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateForecastModal;