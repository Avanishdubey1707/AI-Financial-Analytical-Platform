import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPercent } from "../../lib/format";
import { Card, Skeleton } from "../ui/primitives";

/**
 * change:         number (e.g. 8.4) or null/undefined to hide the badge
 * positiveIsGood: set to false for metrics like expenses, where a drop is good news
 */
const StatCard = ({
    title,
    value,
    change,
    description,
    icon: Icon,
    loading = false,
    error = false,
    positiveIsGood = true,
}) => {
    const hasChange = typeof change === "number" && Number.isFinite(change);
    const isGood = hasChange && change >= 0 === positiveIsGood;
    const ChangeIcon = change >= 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <Card>
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {Icon && (
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                        <Icon className="h-4.5 w-4.5" size={18} />
                    </span>
                )}
            </div>

            {loading ? (
                <>
                    <Skeleton className="mt-4 h-8 w-36" />
                    <Skeleton className="mt-3 h-4 w-44" />
                </>
            ) : (
                <>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                        {error ? "—" : value}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                        {hasChange && !error && (
                            <span
                                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    isGood ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                }`}
                            >
                                <ChangeIcon size={12} />
                                {formatPercent(change)}
                            </span>
                        )}
                        <span className="text-gray-500">
                            {error ? "Unavailable right now" : description}
                        </span>
                    </div>
                </>
            )}
        </Card>
    );
};

export default StatCard;