const stocks = [
    {
        symbol: "RELIANCE",
        name: "Reliance Industries",
        price: "₹2,941.20",
        change: "+1.82%",
        positive: true,
    },
    {
        symbol: "TCS",
        name: "Tata Consultancy",
        price: "₹3,842.65",
        change: "+0.94%",
        positive: true,
    },
    {
        symbol: "INFY",
        name: "Infosys",
        price: "₹1,582.30",
        change: "-0.42%",
        positive: false,
    },
    {
        symbol: "HDFCBANK",
        name: "HDFC Bank",
        price: "₹1,742.15",
        change: "+1.12%",
        positive: true,
    },
];

const MarketWatchlist = () => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div>
                    <h3 className="font-semibold">
                        Market watchlist
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                        AI monitored assets
                    </p>
                </div>

                <button className="text-xs font-semibold text-gray-500 hover:text-gray-900">
                    View all
                </button>
            </div>

            <div className="divide-y divide-gray-100">
                {stocks.map((stock) => (
                    <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-4"
                    >
                        <div>
                            <p className="text-sm font-semibold">
                                {stock.symbol}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                                {stock.name}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-semibold">
                                {stock.price}
                            </p>

                            <p
                                className={`mt-0.5 text-xs font-semibold ${stock.positive
                                        ? "text-green-600"
                                        : "text-red-500"
                                    }`}
                            >
                                {stock.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketWatchlist;