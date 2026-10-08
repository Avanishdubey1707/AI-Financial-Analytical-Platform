import {
    CheckCircle2,
    ShieldCheck,
} from "lucide-react";

const FraudAlertEmptyState = ({
    hasFilter,
    onClear,
}) => {
    return (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={30} />
                </div>

                <div className="mt-5 flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                        {hasFilter
                            ? "No Matching Alerts"
                            : "No Fraud Alerts"}
                    </h2>

                    <CheckCircle2
                        size={18}
                        className="text-emerald-500"
                    />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                    {hasFilter
                        ? "There are no fraud alerts matching the selected status."
                        : "Great! There are currently no suspicious transactions requiring your attention."}
                </p>

                {hasFilter && (
                    <button
                        onClick={onClear}
                        className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        Clear filter →
                    </button>
                )}
            </div>
        </div>
    );
};

export default FraudAlertEmptyState;