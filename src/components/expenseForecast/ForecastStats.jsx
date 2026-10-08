import {
    ArrowDownRight,
    ArrowUpRight,
    IndianRupee,
    Layers3,
    Target,
} from "lucide-react";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

const ForecastStats = ({ forecasts, comparison }) => {
    const totalPredicted = forecasts.reduce(
        (sum, item) =>
            sum + Number(item.predictedAmount || 0),
        0
    );

    const totalActual = comparison.reduce(
        (sum, item) =>
            sum + Number(item.actualAmount || 0),
        0
    );

    const totalVariance =
        totalActual - totalPredicted;

    const variancePercent =
        totalPredicted > 0
            ? (totalVariance / totalPredicted) * 100
            : 0;

    const categories = new Set(
        forecasts.map((item) => item.category)
    ).size;

    const stats = [
        {
            title: "Predicted Spending",
            value: formatCurrency(totalPredicted),
            subtitle: "Forecasted expenses",
            icon: IndianRupee,
            iconClass:
                "bg-indigo-50 text-indigo-600",
        },
        {
            title: "Actual Spending",
            value: formatCurrency(totalActual),
            subtitle: "Recorded expenses",
            icon: Target,
            iconClass:
                "bg-blue-50 text-blue-600",
        },
        {
            title: "Variance",
            value: `${totalVariance >= 0 ? "+" : ""}${formatCurrency(
                totalVariance
            )}`,
            subtitle: `${totalVariance >= 0 ? "+" : ""}${variancePercent.toFixed(
                1
            )}% vs forecast`,
            icon:
                totalVariance >= 0
                    ? ArrowUpRight
                    : ArrowDownRight,
            iconClass:
                totalVariance >= 0
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-600",
            valueClass:
                totalVariance >= 0
                    ? "text-red-600"
                    : "text-emerald-600",
        },
        {
            title: "Categories",
            value: categories,
            subtitle: "Forecast categories",
            icon: Layers3,
            iconClass:
                "bg-violet-50 text-violet-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    {stat.title}
                                </p>

                                <h3
                                    className={`mt-2 text-2xl font-bold ${stat.valueClass ||
                                        "text-slate-900"
                                        }`}
                                >
                                    {stat.value}
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    {stat.subtitle}
                                </p>
                            </div>

                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                            >
                                <Icon size={19} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ForecastStats;