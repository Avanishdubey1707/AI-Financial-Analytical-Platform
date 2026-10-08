import {
    ArrowDownRight,
    ArrowUpRight,
    BrainCircuit,
    TrendingDown,
} from "lucide-react";

const RecommendationStats = ({ recommendations = [] }) => {
    const buyCount = recommendations.filter(
        (item) => item.action === "BUY"
    ).length;

    const sellCount = recommendations.filter(
        (item) => item.action === "SELL"
    ).length;

    const reduceCount = recommendations.filter(
        (item) => item.action === "REDUCE"
    ).length;

    const averageConfidence =
        recommendations.length > 0
            ? recommendations.reduce(
                (sum, item) => sum + Number(item.confidence || 0),
                0
            ) / recommendations.length
            : 0;

    const confidence =
        averageConfidence <= 1
            ? averageConfidence * 100
            : averageConfidence;

    const stats = [
        {
            title: "Total Recommendations",
            value: recommendations.length,
            icon: BrainCircuit,
            iconClass: "bg-indigo-50 text-indigo-600",
        },
        {
            title: "Buy Signals",
            value: buyCount,
            icon: ArrowUpRight,
            iconClass: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Sell Signals",
            value: sellCount,
            icon: ArrowDownRight,
            iconClass: "bg-red-50 text-red-600",
        },
        {
            title: "Reduce Signals",
            value: reduceCount,
            icon: TrendingDown,
            iconClass: "bg-amber-50 text-amber-600",
        },
        {
            title: "Avg. Confidence",
            value: `${confidence.toFixed(1)}%`,
            icon: BrainCircuit,
            iconClass: "bg-blue-50 text-blue-600",
        },
    ];

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.title}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">
                                    {stat.title}
                                </p>

                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {stat.value}
                                </p>
                            </div>

                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RecommendationStats;