import { Filter, X } from "lucide-react";

const RecommendationFilters = ({ riskProfile, setRiskProfile }) => {
    return (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />

                    <span className="text-sm font-semibold text-gray-800">
                        Recommendation Settings
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-gray-500">
                        Risk Profile
                    </label>

                    <select
                        value={riskProfile}
                        onChange={(e) => setRiskProfile(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                    </select>

                    {riskProfile !== "moderate" && (
                        <button
                            type="button"
                            onClick={() => setRiskProfile("moderate")}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        >
                            <X className="h-3 w-3" />
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecommendationFilters;