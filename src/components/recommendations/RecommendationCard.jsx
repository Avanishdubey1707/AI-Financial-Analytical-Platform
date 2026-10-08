import {
    ArrowDownRight,
    ArrowUpRight,
    BrainCircuit,
    ChevronRight,
    TrendingDown,
} from "lucide-react";

const ACTION_CONFIG = {
    BUY: {
        label: "BUY",
        icon: ArrowUpRight,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    SELL: {
        label: "SELL",
        icon: ArrowDownRight,
        className: "bg-red-50 text-red-700 border-red-200",
    },
    REDUCE: {
        label: "REDUCE",
        icon: TrendingDown,
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
};

const formatPercent = (value) => {
    const number = Number(value || 0);

    return `${number.toFixed(2)}%`;
};

const normalizeConfidence = (value) => {
    const number = Number(value || 0);

    return number <= 1 ? number * 100 : number;
};

const RecommendationCard = ({
    recommendation,
    onView,
    onDismiss,
}) => {
    const config =
        ACTION_CONFIG[recommendation.action] || ACTION_CONFIG.BUY;

    const Icon = config.icon;

    const confidence = normalizeConfidence(
        recommendation.confidence
    );

    const expectedReturn = Number(
        recommendation.expectedReturnPct || 0
    );

    return (
        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                            <BrainCircuit className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {recommendation.stockSymbol}
                                </h3>

                                <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${config.className}`}
                                >
                                    <Icon className="h-3 w-3" />
                                    {config.label}
                                </span>
                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                                AI recommendation
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-400">Confidence</p>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                            {confidence.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                            Expected Return
                        </p>

                        <p
                            className={`mt-1 text-sm font-bold ${expectedReturn >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                        >
                            {expectedReturn >= 0 ? "+" : ""}
                            {formatPercent(expectedReturn)}
                        </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                            Confidence
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                            {confidence.toFixed(1)}%
                        </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                            Created
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                            {recommendation.createdAt
                                ? new Date(
                                    recommendation.createdAt
                                ).toLocaleDateString()
                                : "—"}
                        </p>
                    </div>
                </div>

                {/* Reason */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        AI Reasoning
                    </p>

                    <p className="line-clamp-3 text-sm leading-6 text-gray-600">
                        {recommendation.reason ||
                            "No reasoning was provided."}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={() => onDismiss(recommendation)}
                        className="text-sm font-medium text-gray-400 transition hover:text-red-600"
                    >
                        Dismiss
                    </button>

                    <button
                        type="button"
                        onClick={() => onView(recommendation._id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        View Details
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecommendationCard;