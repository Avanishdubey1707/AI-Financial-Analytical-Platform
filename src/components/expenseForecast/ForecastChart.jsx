import {
    Bar,
    BarChart,
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

const ForecastChart = ({ forecasts }) => {
    const chartData = forecasts.map((item) => ({
        category: item.category,
        predicted: Number(
            item.predictedAmount || 0
        ),
    }));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900">
                    Predicted Expenses by Category
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    AI-generated estimate for upcoming spending.
                </p>
            </div>

            <div className="h-[340px] p-4 sm:p-6">
                {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No forecast data available.
                    </div>
                ) : (
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                            />

                            <XAxis
                                dataKey="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#64748b",
                                    fontSize: 11,
                                }}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={65}
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 11,
                                }}
                                tickFormatter={(value) =>
                                    `₹${(value / 1000).toFixed(0)}k`
                                }
                            />

                            <Tooltip
                                formatter={(value) => [
                                    formatCurrency(value),
                                    "Predicted",
                                ]}
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 10px 25px rgba(15,23,42,0.08)",
                                }}
                            />

                            <Bar
                                dataKey="predicted"
                                fill="#4f46e5"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={55}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ForecastChart;