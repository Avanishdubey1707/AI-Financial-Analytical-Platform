import { useState } from "react";

const periods = ["1W", "1M", "3M", "6M", "1Y"];

const PortfolioChart = () => {
    const [period, setPeriod] = useState("1M");

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm text-gray-500">
                        Portfolio performance
                    </p>

                    <div className="mt-1 flex items-end gap-3">
                        <h2 className="text-2xl font-bold">
                            ₹12,84,520
                        </h2>

                        <span className="mb-1 text-sm font-semibold text-green-600">
                            +12.48%
                        </span>
                    </div>
                </div>

                <div className="flex rounded-lg bg-gray-100 p-1">
                    {periods.map((item) => (
                        <button
                            key={item}
                            onClick={() => setPeriod(item)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${period === item
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-400"
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-65 overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map((line) => (
                        <div
                            key={line}
                            className="border-t border-dashed border-gray-100"
                        />
                    ))}
                </div>

                <svg
                    viewBox="0 0 800 260"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                >
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
                                stopColor="#111827"
                                stopOpacity="0.16"
                            />

                            <stop
                                offset="100%"
                                stopColor="#111827"
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>

                    <path
                        d="M0 215 C50 205 75 180 115 190 C150 200 170 155 210 165 C250 175 280 130 315 142 C355 155 370 100 415 115 C455 128 480 88 520 105 C560 120 585 65 625 82 C665 100 690 55 725 67 C755 76 775 35 800 45 L800 260 L0 260 Z"
                        fill="url(#portfolioGradient)"
                    />

                    <path
                        d="M0 215 C50 205 75 180 115 190 C150 200 170 155 210 165 C250 175 280 130 315 142 C355 155 370 100 415 115 C455 128 480 88 520 105 C560 120 585 65 625 82 C665 100 690 55 725 67 C755 76 775 35 800 45"
                        fill="none"
                        stroke="#111827"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-3 text-[10px] text-gray-400">
                    <span>Sep 01</span>
                    <span>Sep 08</span>
                    <span>Sep 15</span>
                    <span>Sep 22</span>
                    <span>Sep 30</span>
                </div>
            </div>
        </div>
    );
};

export default PortfolioChart;