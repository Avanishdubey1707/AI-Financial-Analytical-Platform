import { useWatchlist } from "../../hooks/useDashboardData";
import { formatINR, formatPercent } from "../../lib/format";
import { Card, CardHeader, EmptyState, InlineError, Skeleton } from "../ui/primitives";

const MarketWatchlist = () => {
    const { data, loading, error, refetch } = useWatchlist(5);

    return (
        <Card>
            <CardHeader title="AI watchlist" subtitle="Latest price vs. model forecast" />

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : error && !data ? (
                <InlineError error={error} onRetry={refetch} />
            ) : !data?.length ? (
                <EmptyState
                    title="No forecasts available"
                    message="Predictions will show up here once the model has run on your stocks."
                />
            ) : (
                <ul className="divide-y divide-gray-100">
                    {data.map((stock) => {
                        const up = (stock.expectedChangePct ?? 0) >= 0;

                        return (
                            <li key={stock.symbol} className="flex items-center gap-4 py-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-700">
                                    {stock.symbol.slice(0, 3)}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{stock.symbol}</p>
                                    <p className="truncate text-xs text-gray-500">
                                        {Math.round(stock.confidence)}% confidence
                                        {stock.model ? ` · ${stock.model}` : ""}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {stock.current ? formatINR(stock.current) : "—"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Forecast {formatINR(stock.predicted)}
                                    </p>
                                </div>

                                <span
                                    className={`w-16 rounded-full px-2 py-1 text-center text-xs font-semibold ${
                                        stock.expectedChangePct === null
                                            ? "bg-gray-100 text-gray-500"
                                            : up
                                            ? "bg-green-50 text-green-700"
                                            : "bg-red-50 text-red-700"
                                    }`}
                                >
                                    {formatPercent(stock.expectedChangePct)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
};

export default MarketWatchlist;