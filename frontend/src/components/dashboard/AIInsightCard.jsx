import { useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

import { useRecommendations } from "../../hooks/useDashboardData";
import { api } from "../../lib/api";
import { toScore } from "../../lib/format";
import { Skeleton } from "../ui/primitives";

const ACTION_DOT = {
    buy: "bg-green-400",
    sell: "bg-red-400",
    hold: "bg-amber-300",
};

const actionOf = (rec) => String(rec.action ?? rec.recommendation_type ?? "hold").toLowerCase();

const AIInsightCard = () => {
    const { data, loading, refreshing, error, refetch } = useRecommendations();
    const [generating, setGenerating] = useState(false);
    const [actionError, setActionError] = useState(null);

    const items = [...(data ?? [])].sort((a, b) => toScore(b.confidence) - toScore(a.confidence));
    const [top, ...rest] = items;

    const generate = async () => {
        setGenerating(true);
        setActionError(null);
        try {
            await api.post("/recommendations/generate");
            refetch();
        } catch (e) {
            setActionError(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const dismiss = async (id) => {
        setActionError(null);
        try {
            await api.del(`/recommendations/${id}`);
            refetch();
        } catch (e) {
            setActionError(e.message);
        }
    };

    return (
        <section className="flex flex-col rounded-2xl bg-linear-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    <h2 className="text-base font-semibold">AI insights</h2>
                </div>

                <button
                    onClick={generate}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25 disabled:opacity-60"
                >
                    <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
                    {generating ? "Analyzing…" : "Refresh insights"}
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full bg-white/15!" />
                    <Skeleton className="h-12 w-full bg-white/15!" />
                    <Skeleton className="h-12 w-full bg-white/15!" />
                </div>
            ) : error && !data ? (
                <div className="rounded-xl bg-white/10 p-4 text-sm">
                    <p className="font-medium">Couldn't load insights</p>
                    <p className="mt-1 text-white/70">{error.message}</p>
                    <button onClick={refetch} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-indigo-700">
                        Try again
                    </button>
                </div>
            ) : !top ? (
                <div className="rounded-xl bg-white/10 p-5 text-sm">
                    <p className="font-medium">No insights yet</p>
                    <p className="mt-1 text-white/70">
                        Select "Refresh insights" and the AI will review your holdings and forecasts.
                    </p>
                </div>
            ) : (
                <div className={`space-y-3 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
                    {/* Top recommendation */}
                    <div className="rounded-xl bg-white/10 p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${ACTION_DOT[actionOf(top)] ?? ACTION_DOT.hold}`} />
                                <p className="text-sm font-semibold">
                                    {actionOf(top).charAt(0).toUpperCase() + actionOf(top).slice(1)}{" "}
                                    {top.stock_symbol ?? top.symbol}
                                </p>
                            </div>
                            <button
                                onClick={() => dismiss(top.id)}
                                aria-label="Dismiss recommendation"
                                className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-white/85">{top.reasoning}</p>

                        <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
                            <span>Confidence</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white"
                                    style={{ width: `${toScore(top.confidence)}%` }}
                                />
                            </div>
                            <span className="font-semibold text-white">{Math.round(toScore(top.confidence))}%</span>
                        </div>
                    </div>

                    {/* Other recommendations */}
                    {rest.slice(0, 3).map((rec) => (
                        <div key={rec.id} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${ACTION_DOT[actionOf(rec)] ?? ACTION_DOT.hold}`} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {actionOf(rec).charAt(0).toUpperCase() + actionOf(rec).slice(1)}{" "}
                                    {rec.stock_symbol ?? rec.symbol}
                                </p>
                                <p className="truncate text-xs text-white/65">{rec.reasoning}</p>
                            </div>
                            <span className="text-xs font-semibold">{Math.round(toScore(rec.confidence))}%</span>
                            <button
                                onClick={() => dismiss(rec.id)}
                                aria-label="Dismiss recommendation"
                                className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {actionError && <p className="mt-3 text-xs text-red-200">{actionError}</p>}
        </section>
    );
};

export default AIInsightCard;