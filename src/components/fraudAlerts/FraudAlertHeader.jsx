import {
    RefreshCw,
    ShieldAlert,
    Sparkles,
} from "lucide-react";

const FraudAlertHeader = ({
    onRefresh,
    loading,
}) => {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <ShieldAlert size={22} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Fraud Alerts
                            </h1>

                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                                <Sparkles size={12} />
                                AI Monitoring
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Review suspicious transactions and manage
                            fraud alerts.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
            >
                <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                />

                Refresh
            </button>
        </div>
    );
};

export default FraudAlertHeader;