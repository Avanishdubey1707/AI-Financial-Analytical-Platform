import {
    BrainCircuit,
    Sparkles,
    WandSparkles,
} from "lucide-react";

const RecommendationEmptyState = ({
    onGenerate,
    generating = false,
    hasHistory = false,
}) => {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <BrainCircuit className="h-8 w-8 text-indigo-600" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
                {hasHistory
                    ? "No active recommendations"
                    : "No recommendations yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Generate AI recommendations to analyze your holdings using
                fresh predictions, market prices, confidence scores, and your
                selected risk profile.
            </p>

            <button
                type="button"
                onClick={onGenerate}
                disabled={generating}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
                <WandSparkles className="h-4 w-4" />
                {generating ? "Generating..." : "Generate Recommendations"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
                <Sparkles className="h-3 w-3" />
                Powered by AI
            </div>
        </div>
    );
};

export default RecommendationEmptyState;