import { useMemo } from "react";
import { api, toList } from "../lib/api";
import { pctChange, toScore } from "../lib/format";
import { useAsync } from "./useAsync";


const num = (v) => Number(v) || 0;

const CLOSED_ALERT_STATUSES = ["dismissed", "reviewed", "resolved", "confirmed"];
export const isOpenAlert = (alert) =>
    !CLOSED_ALERT_STATUSES.includes(String(alert?.status ?? "").toLowerCase());

/* ---------- User ---------- */

export const useCurrentUser = () => useAsync(() => api.get("/users/current-user"), []);

/* ---------- Portfolios ---------- */

export function usePortfolioSummary() {
    return useAsync(async () => {
        const portfolios = toList(await api.get("/portfolios"));

        const detailed = await Promise.all(
            portfolios.map(async (p) => {
                const [value, holdings] = await Promise.all([
                    api.get(`/portfolios/${p.id}/value`),
                    api.get(`/portfolios/${p.id}/holdings`),
                ]);

                const isNumber = typeof value === "number";

                return {
                    id: p.id,
                    name: p.name,
                    totalValue: isNumber ? value : num(value?.total_value ?? value?.value),
                    investedValue: isNumber ? 0 : num(value?.invested_value ?? value?.cost_basis),
                    holdings: toList(holdings),
                };
            })
        );

        const totalValue = detailed.reduce((sum, p) => sum + p.totalValue, 0);
        const investedValue = detailed.reduce((sum, p) => sum + p.investedValue, 0);

        return {
            portfolios: detailed,
            holdings: detailed.flatMap((p) => p.holdings),
            totalValue,
            investedValue,
            returnPct: investedValue > 0 ? pctChange(totalValue, investedValue) : null,
        };
    }, []);
}

// Merges the performance series of several portfolios into one line.
export function usePortfolioPerformance(portfolioIds, range) {
    const key = portfolioIds.join(",");

    return useAsync(async () => {
        if (!portfolioIds.length) return [];

        const results = await Promise.all(
            portfolioIds.map((id) => api.get(`/portfolios/${id}/performance`, { range }))
        );

        const byDate = new Map();
        results.forEach((result) =>
            toList(result).forEach((point) => {
                const date = point.date ?? point.timestamp;
                byDate.set(date, (byDate.get(date) ?? 0) + num(point.value ?? point.total_value));
            })
        );

        return [...byDate.entries()]
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, value]) => ({ date, value }));
    }, [key, range]);
}

/* ---------- Income / expenses ---------- */

function deriveCashflow(summary) {
    if (!summary) return null;

    const months = toList(summary.monthly ?? summary.months)
        .map((m) => ({ month: m.month, income: num(m.income), expense: num(m.expense) }))
        .sort((a, b) => String(a.month).localeCompare(String(b.month)));

    const current = months.at(-1);
    const previous = months.at(-2);

    const savingsRate = (m) => (m && m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : null);
    const currentRate = savingsRate(current);
    const previousRate = savingsRate(previous);

    return {
        balance: num(summary.balance),
        expenses: current?.expense ?? 0,
        expensesChange: current && previous ? pctChange(current.expense, previous.expense) : null,
        savingsRate: currentRate,
        // difference in percentage points vs. last month
        savingsRateChange:
            currentRate !== null && previousRate !== null ? currentRate - previousRate : null,
    };
}

export function useCashflow() {
    const state = useAsync(() => api.get("/transactions/summary"), []);
    const data = useMemo(() => deriveCashflow(state.data), [state.data]);
    return { ...state, data };
}

/* ---------- Transactions & fraud ---------- */

export const useRecentTransactions = (limit = 6) =>
    useAsync(async () => toList(await api.get("/transactions", { limit, sort: "-date" })), [limit]);

export const useFraudAlerts = () =>
    useAsync(async () => toList(await api.get("/fraud-alerts")), []);

/* ---------- AI ---------- */

export const useRecommendations = () =>
    useAsync(async () => toList(await api.get("/recommendations")), []);

export function useWatchlist(limit = 5) {
    return useAsync(async () => {
        const predictions = toList(await api.get("/predictions/latest"));

        const seen = new Set();
        const top = [];
        for (const p of predictions) {
            const symbol = p.stock_symbol ?? p.symbol;
            if (symbol && !seen.has(symbol)) {
                seen.add(symbol);
                top.push({ ...p, symbol });
            }
            if (top.length >= limit) break;
        }

        return Promise.all(
            top.map(async (p) => {
                let current = null;
                try {
                    const latest = await api.get(`/stocks/${p.symbol}/prices/latest`);
                    current = num(latest?.close ?? latest?.price) || null;
                } catch {
                    // a missing price shouldn't hide the prediction
                }

                const predicted = num(p.predicted_price);

                return {
                    symbol: p.symbol,
                    predicted,
                    current,
                    expectedChangePct: current ? pctChange(predicted, current) : null,
                    confidence: toScore(p.confidence),
                    model: p.model_used,
                };
            })
        );
    }, [limit]);
}