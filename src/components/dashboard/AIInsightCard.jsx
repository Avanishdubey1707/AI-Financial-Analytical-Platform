import {
    ArrowRight,
    BrainCircuit,
    Sparkles,
} from "lucide-react";

const AIInsightCard = () => {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-6 text-white">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

            <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                            <BrainCircuit size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                AI Financial Insight
                            </p>

                            <p className="text-[11px] text-gray-400">
                                Updated 4 min ago
                            </p>
                        </div>
                    </div>

                    <Sparkles size={17} className="text-gray-400" />
                </div>

                <h3 className="text-lg font-semibold leading-7">
                    Your portfolio is showing strong momentum.
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                    Technology exposure has contributed 64% of your
                    recent gains. However, your concentration risk is
                    above the recommended level.
                </p>

                <div className="mt-5 rounded-xl bg-white/5 p-4">
                    <p className="text-xs font-medium text-gray-400">
                        AI recommendation
                    </p>

                    <p className="mt-1 text-sm font-medium">
                        Consider diversifying 8–12% into defensive
                        assets.
                    </p>
                </div>

                <button className="mt-5 flex items-center gap-2 text-sm font-semibold text-white hover:gap-3">
                    View full analysis
                    <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
};

export default AIInsightCard;