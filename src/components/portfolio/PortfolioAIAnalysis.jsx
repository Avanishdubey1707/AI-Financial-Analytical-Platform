import {
    Brain,
    Lightbulb,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

const PortfolioAIAnalysis = ({ portfolioValue }) => {
    const totalValue = portfolioValue?.totalValue || 0;
    const totalCost = portfolioValue?.totalCost || 0;
    const gainLoss = portfolioValue?.totalGainLoss || 0;

    const returnPercentage =
        totalCost > 0
            ? (gainLoss / totalCost) * 100
            : 0;

    let analysis =
        "Your portfolio is ready for AI-powered analysis.";

    if (returnPercentage > 10) {
        analysis =
            "Your portfolio is showing strong overall performance. Consider reviewing concentration and periodically rebalancing to maintain your target risk.";
    } else if (returnPercentage > 0) {
        analysis =
            "Your portfolio is currently generating a positive return. Diversification and consistent monitoring can help manage long-term risk.";
    } else if (returnPercentage < 0) {
        analysis =
            "Your portfolio is currently below its invested value. Review underperforming holdings and ensure your allocation still matches your investment strategy.";
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm">
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                        <Brain size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-slate-900">
                                AI Portfolio Analysis
                            </h2>

                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                                <Sparkles size={12} />
                                AI Insight
                            </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {analysis}
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/70 bg-white/70 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Lightbulb size={16} />
                            <span className="text-xs font-medium">
                                Return
                            </span>
                        </div>

                        <p className="mt-2 text-lg font-bold text-slate-900">
                            {returnPercentage.toFixed(2)}%
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/70 bg-white/70 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <ShieldCheck size={16} />
                            <span className="text-xs font-medium">
                                Risk
                            </span>
                        </div>

                        <p className="mt-2 text-lg font-bold text-slate-900">
                            Moderate
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/70 bg-white/70 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Sparkles size={16} />
                            <span className="text-xs font-medium">
                                Portfolio Value
                            </span>
                        </div>

                        <p className="mt-2 text-lg font-bold text-slate-900">
                            ₹{Math.round(totalValue).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioAIAnalysis;