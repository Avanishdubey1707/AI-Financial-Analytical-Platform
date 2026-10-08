import { useState } from "react";
import { api } from "../../lib/api";
import { isOpenAlert } from "../../hooks/useDashboardData";
import { toScore } from "../../lib/format";
import { Card, CardHeader, InlineError, Skeleton } from "../ui/primitives";

const LEVELS = {
    low: { label: "Low", bar: "bg-green-500", text: "text-green-600" },
    medium: { label: "Medium", bar: "bg-amber-500", text: "text-amber-600" },
    high: { label: "High", bar: "bg-red-500", text: "text-red-600" },
};

const fraudLevel = (score) => (score < 40 ? "low" : score < 70 ? "medium" : "high");
const concentrationLevel = (weight) => (weight < 25 ? "low" : weight < 45 ? "medium" : "high");

// Largest single position as a share of total invested cost (quantity × avg price).
function topConcentration(holdings = []) {
    const bySymbol = new Map();
    let total = 0;

    holdings.forEach((h) => {
        const symbol = h.stock_symbol ?? h.symbol;
        const cost = (Number(h.quantity) || 0) * (Number(h.avg_price) || 0);
        bySymbol.set(symbol, (bySymbol.get(symbol) ?? 0) + cost);
        total += cost;
    });

    if (!total) return null;

    const [symbol, cost] = [...bySymbol.entries()].sort((a, b) => b[1] - a[1])[0];
    return { symbol, weight: (cost / total) * 100, positions: bySymbol.size };
}

const Meter = ({ label, value, level, hint }) => (
    <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{label}</span>
            <span className={`font-semibold ${LEVELS[level].text}`}>{LEVELS[level].label}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
                className={`h-full rounded-full ${LEVELS[level].bar}`}
                style={{ width: `${Math.min(100, Math.max(value, 2))}%` }}
            />
        </div>
        {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
);

/**
 * alertsState:    result of useFraudAlerts()
 * portfolioState: result of usePortfolioSummary()
 */
const RiskCard = ({ alertsState, portfolioState }) => {
    const [busyId, setBusyId] = useState(null);
    const [actionError, setActionError] = useState(null);

    const loading = alertsState.loading || portfolioState.loading;

    const openAlerts = (alertsState.data ?? [])
        .filter(isOpenAlert)
        .map((a) => ({ ...a, score: toScore(a.risk_score) }))
        .sort((a, b) => b.score - a.score);

    const fraudScore = openAlerts[0]?.score ?? 0;
    const concentration = topConcentration(portfolioState.data?.holdings);

    const dismiss = async (id) => {
        setBusyId(id);
        setActionError(null);
        try {
            await api.put(`/fraud-alerts/${id}/status`, { status: "dismissed" });
            alertsState.refetch();
        } catch (e) {
            setActionError(e.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Card>
            <CardHeader title="Risk overview" subtitle="Fraud signals and portfolio concentration" />

            {loading ? (
                <div className="space-y-5">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : alertsState.error && !alertsState.data ? (
                <InlineError error={alertsState.error} onRetry={alertsState.refetch} />
            ) : (
                <div className="space-y-5">
                    <Meter
                        label="Fraud exposure"
                        value={fraudScore}
                        level={fraudLevel(fraudScore)}
                        hint={
                            openAlerts.length
                                ? `${openAlerts.length} open alert${openAlerts.length > 1 ? "s" : ""}, highest risk score ${Math.round(fraudScore)}/100`
                                : "No open alerts on your transactions"
                        }
                    />

                    {concentration && (
                        <Meter
                            label="Portfolio concentration"
                            value={concentration.weight}
                            level={concentrationLevel(concentration.weight)}
                            hint={`${concentration.symbol} is ${Math.round(concentration.weight)}% of your invested amount across ${concentration.positions} position${concentration.positions > 1 ? "s" : ""}`}
                        />
                    )}

                    {openAlerts.length > 0 && (
                        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                            {openAlerts.slice(0, 3).map((alert) => (
                                <li key={alert.id} className="flex items-center gap-3 px-4 py-3">
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${LEVELS[fraudLevel(alert.score)].bar}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-800">
                                            {alert.description ?? `Transaction #${alert.transaction_id}`}
                                        </p>
                                        <p className="text-xs text-gray-500">Risk score {Math.round(alert.score)}/100</p>
                                    </div>
                                    <button
                                        onClick={() => dismiss(alert.id)}
                                        disabled={busyId === alert.id}
                                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {busyId === alert.id ? "Saving…" : "Dismiss"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {actionError && <p className="text-xs text-red-600">{actionError}</p>}
                </div>
            )}
        </Card>
    );
};

export default RiskCard;