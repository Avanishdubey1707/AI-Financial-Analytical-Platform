import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

const PortfolioPerformance = ({ performance }) => {
    const data = (performance || []).map((item) => ({
        ...item,
        date: item.date
            ? new Date(item.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            })
            : "",
    }));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-semibold text-slate-900">
                        Portfolio Performance
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Historical portfolio value over time.
                    </p>
                </div>
            </div>

            <div className="h-[320px] p-4 sm:p-6">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <p className="font-medium text-slate-700">
                                No performance data
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                Performance history will appear here once
                                market data is available.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient
                                    id="portfolioGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopOpacity={0.25}
                                    />

                                    <stop
                                        offset="100%"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                            />

                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 12,
                                }}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={70}
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 12,
                                }}
                                tickFormatter={(value) =>
                                    `₹${(value / 1000).toFixed(0)}k`
                                }
                            />

                            <Tooltip
                                formatter={(value) => [
                                    formatCurrency(value),
                                    "Portfolio Value",
                                ]}
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 10px 25px rgba(15,23,42,0.08)",
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#4f46e5"
                                strokeWidth={2.5}
                                fill="url(#portfolioGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default PortfolioPerformance;