import {
    ArrowDownRight,
    ArrowUpRight,
    BrainCircuit,
    Check,
    Clock,
    TrendingDown,
    X,
} from "lucide-react";

const normalizeConfidence = (value) => {
    const number = Number(value || 0);
    return number <= 1 ? number * 100 : number;
};

const RecommendationDetailsModal = ({
    recommendation,
    open,
    onClose,
}) => {
    if (!open || !recommendation) return null;

    const confidence = normalizeConfidence(
        recommendation.confidence
    );

    const expectedReturn = Number(
        recommendation.expectedReturnPct || 0
    );

    const actionConfig = {
        BUY: {
            icon: ArrowUpRight,
            label: "BUY",
            className: "bg-emerald-50 text-emerald-700",
        },
        SELL: {
            icon: ArrowDownRight,
            label: "SELL",
            className: "bg-red-50 text-red-700",
        },
        REDUCE: {
            icon: TrendingDown,
            label: "REDUCE",
            className: "bg-amber-50 text-amber-700",
        },
    };

    const config =
        actionConfig[recommendation.action] ||
        actionConfig.BUY;

    const ActionIcon = config.icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                            <BrainCircuit className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                            <h2 className="font-bold text-gray-900">
                                {recommendation.stockSymbol} Recommendation
                            </h2>

                            <p className="text-xs text-gray-400">
                                AI-generated investment insight
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 p-6">
                    {/* Action */}
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Recommended Action
                                </p>

                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${config.className}`}
                                    >
                                        <ActionIcon className="h-4 w-4" />
                                        {config.label}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-gray-400">
                                    Expected Return
                                </p>

                                <p
                                    className={`mt-1 text-xl font-bold ${expectedReturn >= 0
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {expectedReturn >= 0 ? "+" : ""}
                                    {expectedReturn.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Confidence
                            </p>

                            <p className="mt-2 text-lg font-bold text-gray-900">
                                {confidence.toFixed(1)}%
                            </p>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-indigo-600"
                                    style={{
                                        width: `${Math.min(confidence, 100)}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Generated
                            </p>

                            <p className="mt-2 text-sm font-semibold text-gray-900">
                                {recommendation.createdAt
                                    ? new Date(
                                        recommendation.createdAt
                                    ).toLocaleString()
                                    : "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Recommendation ID
                            </p>

                            <p className="mt-2 truncate text-xs font-medium text-gray-700">
                                {recommendation._id}
                            </p>
                        </div>
                    </div>

                    {/* Reasoning */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                        <div className="mb-3 flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-indigo-600" />

                            <h3 className="font-semibold text-gray-900">
                                AI Reasoning
                            </h3>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">
                            {recommendation.reason ||
                                "No reasoning was provided."}
                        </p>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                        <p className="text-xs leading-5 text-amber-800">
                            This recommendation is generated from available portfolio
                            and prediction data. It is an analytical insight, not
                            guaranteed financial advice.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <Check className="h-4 w-4" />
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecommendationDetailsModal;