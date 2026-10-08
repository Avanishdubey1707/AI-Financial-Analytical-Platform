import { formatDate, formatINR } from "../../lib/format";
import { Card, CardHeader, EmptyState, InlineError, Skeleton } from "../ui/primitives";

const CREDIT_TYPES = ["credit", "income", "deposit"];

/**
 * state:      result of useRecentTransactions()
 * flaggedIds: Set of transaction ids that have an open fraud alert
 */
const RecentTransactions = ({ state, flaggedIds = new Set() }) => {
    const { data, loading, error, refetch } = state;

    return (
        <Card>
            <CardHeader
                title="Recent transactions"
                action={
                    <a href="/transactions" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        View all
                    </a>
                }
            />

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : error && !data ? (
                <InlineError error={error} onRetry={refetch} />
            ) : !data?.length ? (
                <EmptyState
                    title="No transactions yet"
                    message="Add your first transaction and it will be checked for fraud automatically."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-130 text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-500">
                                <th className="pb-3 font-medium">Description</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 text-right font-medium">Amount</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {data.map((t) => {
                                const isCredit = CREDIT_TYPES.includes(String(t.type).toLowerCase());
                                const flagged = flaggedIds.has(t.id);
                                const name = t.description || t.category || "Transaction";

                                return (
                                    <tr key={t.id}>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-600">
                                                    {name.charAt(0).toUpperCase()}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{name}</p>
                                                    {t.category && (
                                                        <p className="text-xs capitalize text-gray-500">{t.category}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3 text-gray-500">{formatDate(t.date)}</td>

                                        <td className="py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    flagged ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {flagged ? "Flagged" : "Cleared"}
                                            </span>
                                        </td>

                                        <td
                                            className={`py-3 text-right font-semibold ${
                                                isCredit ? "text-green-600" : "text-gray-900"
                                            }`}
                                        >
                                            {isCredit ? "+" : "−"}
                                            {formatINR(Math.abs(Number(t.amount) || 0))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

export default RecentTransactions;