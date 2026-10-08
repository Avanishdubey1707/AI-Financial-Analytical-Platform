import {
    ArrowDownRight,
    ArrowUpRight,
    BriefcaseBusiness,
    IndianRupee,
    TrendingUp,
} from "lucide-react";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

const PortfolioStats = ({ portfolioValue }) => {
    const totalValue = portfolioValue?.totalValue || 0;
    const totalCost = portfolioValue?.totalCost || 0;
    const totalGainLoss = portfolioValue?.totalGainLoss || 0;

    const returnPercentage =
        totalCost > 0
            ? (totalGainLoss / totalCost) * 100
            : 0;

    const isPositive = totalGainLoss >= 0;

    const stats = [
        {
            title: "Current Value",
            value: formatCurrency(totalValue),
            icon: IndianRupee,
            iconClass: "bg-indigo-50 text-indigo-600",
        },
        {
            title: "Invested Amount",
            value: formatCurrency(totalCost),
            icon: BriefcaseBusiness,
            iconClass: "bg-blue-50 text-blue-600",
        },
        {
            title: "Total Return",
            value: `${isPositive ? "+" : ""}${formatCurrency(
                totalGainLoss
            )}`,
            subtitle: `${isPositive ? "+" : ""}${returnPercentage.toFixed(
                2
            )}%`,
            icon: isPositive ? ArrowUpRight : ArrowDownRight,
            iconClass: isPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600",
            valueClass: isPositive
                ? "text-emerald-600"
                : "text-red-600",
        },
        {
            title: "Holdings",
            value: portfolioValue?.holdingsWithValue?.length || 0,
            icon: TrendingUp,
            iconClass: "bg-violet-50 text-violet-600",
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
                                    className={`mt-2 text-2xl font-bold ${stat.valueClass || "text-slate-900"
                                        }`}
                                >
                                    {stat.value}
                                </h3>

                                {stat.subtitle && (
                                    <p
                                        className={`mt-1 text-sm font-medium ${isPositive
                                                ? "text-emerald-600"
                                                : "text-red-600"
                                            }`}
                                    >
                                        {stat.subtitle} overall
                                    </p>
                                )}
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

export default PortfolioStats;