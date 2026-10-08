import {
    BrainCircuit,
    RefreshCw,
    Sparkles,
    WandSparkles,
} from "lucide-react";

const RecommendationHeader = ({
    onGenerate,
    onRefresh,
    loading = false,
    generating = false,
}) => {
    return (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                        <BrainCircuit className="h-5 w-5 text-indigo-600" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            AI Recommendations
                        </h1>

                        <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                <Sparkles className="h-3 w-3" />
                                AI Powered
                            </span>
                        </div>
                    </div>
                </div>

                <p className="max-w-2xl text-sm text-gray-500">
                    Get AI-powered BUY, SELL, and REDUCE recommendations based on your
                    portfolio holdings, market prices, predictions, confidence, and risk
                    profile.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading || generating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </button>

                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={generating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <WandSparkles
                        className={`h-4 w-4 ${generating ? "animate-pulse" : ""}`}
                    />
                    {generating ? "Generating..." : "Generate AI Recommendations"}
                </button>
            </div>
        </div>
    );
};

export default RecommendationHeader;