import {
    BrainCircuit,
    Check,
    Sparkles,
    X,
} from "lucide-react";

const GenerateRecommendationModal = ({
    open,
    riskProfile,
    setRiskProfile,
    onClose,
    onGenerate,
    generating = false,
}) => {
    if (!open) return null;

    const profiles = [
        {
            value: "conservative",
            title: "Conservative",
            description:
                "Prefer lower-risk opportunities and stronger confidence signals.",
        },
        {
            value: "moderate",
            title: "Moderate",
            description:
                "Balance potential returns with portfolio risk.",
        },
        {
            value: "aggressive",
            title: "Aggressive",
            description:
                "Accept higher risk for potentially higher returns.",
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !generating) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                            <h2 className="font-bold text-gray-900">
                                Generate AI Recommendations
                            </h2>

                            <p className="text-xs text-gray-400">
                                Choose your preferred risk profile
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={generating}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    {profiles.map((profile) => {
                        const selected = riskProfile === profile.value;

                        return (
                            <button
                                key={profile.value}
                                type="button"
                                onClick={() => setRiskProfile(profile.value)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${selected
                                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${selected
                                                ? "border-indigo-600 bg-indigo-600"
                                                : "border-gray-300"
                                            }`}
                                    >
                                        {selected && (
                                            <Check className="h-3 w-3 text-white" />
                                        )}
                                    </div>

                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {profile.title}
                                        </p>

                                        <p className="mt-1 text-sm leading-5 text-gray-500">
                                            {profile.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    <div className="rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-500">
                        <div className="mb-1 flex items-center gap-2 font-semibold text-gray-700">
                            <BrainCircuit className="h-4 w-4 text-indigo-600" />
                            What will be analyzed?
                        </div>

                        Your holdings, latest market prices, fresh stock predictions,
                        expected returns, confidence levels, and portfolio
                        concentration.
                    </div>

                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={generating}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Sparkles className="h-4 w-4" />

                        {generating
                            ? "Generating recommendations..."
                            : "Generate Recommendations"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateRecommendationModal;