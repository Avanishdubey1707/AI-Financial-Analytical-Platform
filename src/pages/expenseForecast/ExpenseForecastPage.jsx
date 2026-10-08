import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getExpenseForecasts,
    getExpenseForecastSummary,
    generateExpenseForecasts,
} from "../../api/expenseForecastApi";

import ExpenseForecastHeader from "../../components/expenseForecast/ExpenseForecastHeader";
import ForecastFilters from "../../components/expenseForecast/ForecastFilters";
import ForecastStats from "../../components/expenseForecast/ForecastStats";
import ForecastChart from "../../components/expenseForecast/ForecastChart";
import ForecastTable from "../../components/expenseForecast/ForecastTable";
import ForecastComparison from "../../components/expenseForecast/ForecastComparison";
import GenerateForecastModal from "../../components/expenseForecast/GenerateForecastModal";
import ForecastEmptyState from "../../components/expenseForecast/ForecastEmptyState";

const ExpenseForecastPage = () => {
    const [forecasts, setForecasts] = useState(
        []
    );

    const [comparison, setComparison] = useState(
        []
    );

    const [selectedMonth, setSelectedMonth] =
        useState("");

    const [selectedCategory, setSelectedCategory] =
        useState("");

    const [comparisonMonth, setComparisonMonth] =
        useState("");

    const [loading, setLoading] = useState(true);
    const [comparisonLoading, setComparisonLoading] =
        useState(false);

    const [generating, setGenerating] =
        useState(false);

    const [error, setError] = useState("");

    const [generateModalOpen, setGenerateModalOpen] =
        useState(false);

    // --------------------------------------------------
    // Categories
    // --------------------------------------------------

    const categories = useMemo(() => {
        return [
            ...new Set(
                forecasts
                    .map((item) => item.category)
                    .filter(Boolean)
            ),
        ].sort();
    }, [forecasts]);

    // --------------------------------------------------
    // Load forecasts
    // --------------------------------------------------

    const loadForecasts = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) {
                    setLoading(true);
                }

                setError("");

                const params = {
                    page: 1,
                    limit: 100,
                };

                if (selectedMonth) {
                    params.month = selectedMonth;
                }

                if (selectedCategory) {
                    params.category = selectedCategory;
                }

                const response =
                    await getExpenseForecasts(params);

                const data =
                    response?.data || response || {};

                setForecasts(
                    data.forecasts ||
                    response?.forecasts ||
                    []
                );
            } catch (err) {
                console.error(
                    "Failed to load expense forecasts:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    "Failed to load expense forecasts."
                );
            } finally {
                if (showLoader) {
                    setLoading(false);
                }
            }
        },
        [selectedMonth, selectedCategory]
    );

    // --------------------------------------------------
    // Load comparison
    // --------------------------------------------------

    const loadComparison = useCallback(
        async (month) => {
            if (!month) {
                setComparison([]);
                return;
            }

            try {
                setComparisonLoading(true);

                const response =
                    await getExpenseForecastSummary(month);

                const data =
                    response?.data || response || {};

                setComparison(
                    data.comparison ||
                    response?.comparison ||
                    []
                );
            } catch (err) {
                console.error(
                    "Failed to load forecast comparison:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    "Failed to load forecast comparison."
                );
            } finally {
                setComparisonLoading(false);
            }
        },
        []
    );

    // --------------------------------------------------
    // Initial load
    // --------------------------------------------------

    useEffect(() => {
        loadForecasts();
    }, [loadForecasts]);

    // --------------------------------------------------
    // Automatically select comparison month
    // --------------------------------------------------

    useEffect(() => {
        if (
            !comparisonMonth &&
            forecasts.length > 0
        ) {
            const firstMonth = forecasts[0]?.month;

            if (firstMonth) {
                setComparisonMonth(firstMonth);
            }
        }
    }, [forecasts, comparisonMonth]);

    // --------------------------------------------------
    // Load comparison when month changes
    // --------------------------------------------------

    useEffect(() => {
        if (comparisonMonth) {
            loadComparison(comparisonMonth);
        }
    }, [
        comparisonMonth,
        loadComparison,
    ]);

    // --------------------------------------------------
    // Generate forecast
    // --------------------------------------------------

    const handleGenerate = async (config) => {
        try {
            setGenerating(true);
            setError("");

            await generateExpenseForecasts(config);

            setGenerateModalOpen(false);

            await loadForecasts();

            // Use current selected month if available.
            // Otherwise the newly generated forecast month
            // will be selected from returned data.
            if (selectedMonth) {
                await loadComparison(selectedMonth);
            }
        } catch (err) {
            console.error(
                "Failed to generate forecast:",
                err
            );

            const status =
                err?.response?.status;

            if (status === 422) {
                setError(
                    err?.response?.data?.message ||
                    "Not enough transaction history to generate a forecast."
                );
            } else if (status === 503) {
                setError(
                    "The forecasting service is currently unavailable. Please try again later."
                );
            } else {
                setError(
                    err?.response?.data?.message ||
                    "Failed to generate expense forecast."
                );
            }
        } finally {
            setGenerating(false);
        }
    };

    // --------------------------------------------------
    // Refresh
    // --------------------------------------------------

    const handleRefresh = async () => {
        await loadForecasts();

        if (comparisonMonth) {
            await loadComparison(comparisonMonth);
        }
    };

    // --------------------------------------------------
    // Clear filters
    // --------------------------------------------------

    const handleClearFilters = () => {
        setSelectedMonth("");
        setSelectedCategory("");
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <ExpenseForecastHeader
                    onGenerate={() =>
                        setGenerateModalOpen(true)
                    }
                    onRefresh={handleRefresh}
                    loading={
                        loading || comparisonLoading
                    }
                />

                {/* Error */}
                {error && (
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{error}</span>

                        <button
                            onClick={() => setError("")}
                            className="shrink-0 font-medium hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Filters */}
                <ForecastFilters
                    month={selectedMonth}
                    category={selectedCategory}
                    categories={categories}
                    onMonthChange={setSelectedMonth}
                    onCategoryChange={
                        setSelectedCategory
                    }
                    onClear={handleClearFilters}
                />

                {/* Loading */}
                {loading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-32 animate-pulse rounded-2xl bg-slate-200"
                                />
                            ))}
                        </div>

                        <div className="h-[340px] animate-pulse rounded-2xl bg-slate-200" />

                        <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                    </div>
                ) : forecasts.length === 0 ? (
                    <ForecastEmptyState
                        onGenerate={() =>
                            setGenerateModalOpen(true)
                        }
                    />
                ) : (
                    <>
                        {/* Stats */}
                        <ForecastStats
                            forecasts={forecasts}
                            comparison={comparison}
                        />

                        {/* Chart */}
                        <ForecastChart
                            forecasts={forecasts}
                        />

                        {/* Forecast table */}
                        <ForecastTable
                            forecasts={forecasts}
                        />

                        {/* Comparison month selector */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Spending Accuracy
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Compare your forecast with actual
                                        expenses.
                                    </p>
                                </div>

                                <input
                                    type="month"
                                    value={comparisonMonth}
                                    onChange={(e) =>
                                        setComparisonMonth(
                                            e.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>
                        </div>

                        {/* Comparison */}
                        <ForecastComparison
                            comparison={comparison}
                            month={comparisonMonth}
                        />
                    </>
                )}
            </div>

            {/* Generate modal */}
            <GenerateForecastModal
                open={generateModalOpen}
                onClose={() =>
                    setGenerateModalOpen(false)
                }
                onSubmit={handleGenerate}
                loading={generating}
            />
        </>
    );
};

export default ExpenseForecastPage;