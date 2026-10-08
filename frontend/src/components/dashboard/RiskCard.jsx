import {
    ShieldCheck,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

const RiskCard = () => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        Portfolio risk
                    </p>

                    <h3 className="mt-1 text-2xl font-bold">
                        Moderate
                    </h3>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                    <ShieldCheck
                        size={20}
                        className="text-green-600"
                    />
                </div>
            </div>

            <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs">
                    <span className="text-gray-400">
                        Risk score
                    </span>

                    <span className="font-semibold">
                        42 / 100
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[42%] rounded-full bg-gray-900" />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                    <TrendingUp size={15} />

                    <p className="mt-2 text-xs text-gray-400">
                        Upside
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                        +18.4%
                    </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                    <TrendingDown size={15} />

                    <p className="mt-2 text-xs text-gray-400">
                        Drawdown
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                        -7.2%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiskCard;