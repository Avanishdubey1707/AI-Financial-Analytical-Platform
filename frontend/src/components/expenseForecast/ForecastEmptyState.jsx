import {
    Brain,
    Sparkles,
} from "lucide-react";

const ForecastEmptyState = ({
    onGenerate,
}) => {
    return (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Brain size={28} />
                </div>

                <div className="mt-5 flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                        No Expense Forecast Yet
                    </h2>

                    <Sparkles
                        size={18}
                        className="text-indigo-500"
                    />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Generate an AI-powered expense forecast using
                    your historical transaction data.
                </p>

                <button
                    onClick={onGenerate}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    <Sparkles size={16} />
                    Generate Forecast
                </button>
            </div>
        </div>
    );
};

export default ForecastEmptyState;