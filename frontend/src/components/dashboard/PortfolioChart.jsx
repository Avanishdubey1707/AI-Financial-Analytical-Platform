import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { usePortfolioPerformance } from "../../hooks/useDashboardData";
import { formatDate, formatINR, formatPercent, pctChange } from "../../lib/format";
import { Card, CardHeader, EmptyState, InlineError, Skeleton } from "../ui/primitives";

const RANGES = ["1W", "1M", "3M", "1Y"];

const PortfolioChart = ({ portfolioIds = [], portfolioLoading = false }) => {
    const [range, setRange] = useState("1M");
    const { data, loading, refreshing, error, refetch } = usePortfolioPerformance(
        portfolioIds,
        range
    );

    const points = data ?? [];
    const first = points[0]?.value;
    const last = points.at(-1)?.value;
    const change = points.length > 1 ? pctChange(last, first) : null;
    const isUp = (change ?? 0) >= 0;
    const color = isUp ? "#10b981" : "#f43f5e";

    const rangeSwitcher = (
        <div className="flex rounded-xl bg-gray-100 p-1">
            {RANGES.map((r) => (
                <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                        range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    {r}
                </button>
            ))}
        </div>
    );

    return (
        <Card>
            <CardHeader
                title="Portfolio performance"
                subtitle={
                    change !== null
                        ? `${formatPercent(change)} over the last ${range}`
                        : "Combined value of all your portfolios"
                }
                action={rangeSwitcher}
            />

            {portfolioLoading || loading ? (
                <Skeleton className="h-72 w-full" />
            ) : error && !data ? (
                <InlineError error={error} onRetry={refetch} />
            ) : points.length === 0 ? (
                <EmptyState
                    title="No performance data yet"
                    message="Add holdings to a portfolio and your value history will appear here."
                />
            ) : (
                <div className={`h-72 transition-opacity ${refreshing ? "opacity-50" : ""}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid stroke="#f3f4f6" vertical={false} />

                            <XAxis
                                dataKey="date"
                                tickFormatter={(d) => formatDate(d)}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: "#9ca3af" }}
                                minTickGap={32}
                            />
                            <YAxis
                                tickFormatter={(v) => formatINR(v, { compact: true })}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: "#9ca3af" }}
                                width={64}
                                domain={["auto", "auto"]}
                            />

                            <Tooltip
                                formatter={(v) => [formatINR(v), "Value"]}
                                labelFormatter={(d) =>
                                    formatDate(d, { day: "numeric", month: "short", year: "numeric" })
                                }
                                contentStyle={{
                                    borderRadius: 12,
                                    border: "1px solid #e5e7eb",
                                    boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
                                    fontSize: 13,
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2.5}
                                fill="url(#portfolioFill)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};

export default PortfolioChart;