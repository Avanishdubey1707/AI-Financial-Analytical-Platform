import { ChevronDown, BriefcaseBusiness } from "lucide-react";

const PortfolioSelector = ({
    portfolios,
    activePortfolio,
    onSelect,
}) => {
    if (!portfolios?.length) {
        return null;
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BriefcaseBusiness size={19} />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Selected Portfolio
                    </p>

                    <div className="relative mt-0.5">
                        <select
                            value={activePortfolio?._id || ""}
                            onChange={(e) => onSelect(e.target.value)}
                            className="cursor-pointer appearance-none bg-transparent pr-7 text-sm font-semibold text-slate-800 outline-none"
                        >
                            {portfolios.map((portfolio) => (
                                <option
                                    key={portfolio._id}
                                    value={portfolio._id}
                                >
                                    {portfolio.name}
                                </option>
                            ))}
                        </select>

                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSelector;