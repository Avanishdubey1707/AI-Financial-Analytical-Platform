import {
    Filter,
    X,
} from "lucide-react";

const STATUSES = [
    {
        value: "PENDING",
        label: "Pending",
    },
    {
        value: "REVIEWED",
        label: "Reviewed",
    },
    {
        value: "CONFIRMED",
        label: "Confirmed",
    },
    {
        value: "DISMISSED",
        label: "Dismissed",
    },
];

const FraudAlertFilters = ({
    status,
    onStatusChange,
    onClear,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex items-center gap-2 sm:mr-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Filter size={16} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Filter Alerts
                        </p>

                        <p className="text-xs text-slate-400">
                            Filter by review status
                        </p>
                    </div>
                </div>

                <div className="w-full sm:max-w-xs">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        Status
                    </label>

                    <select
                        value={status}
                        onChange={(e) =>
                            onStatusChange(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    >
                        <option value="">
                            All Alerts
                        </option>

                        {STATUSES.map((item) => (
                            <option
                                key={item.value}
                                value={item.value}
                            >
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                {status && (
                    <button
                        onClick={onClear}
                        className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <X size={15} />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default FraudAlertFilters;