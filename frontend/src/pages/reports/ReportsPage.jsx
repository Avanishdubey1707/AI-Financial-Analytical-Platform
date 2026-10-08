import { useState } from "react";

import GenerateReportCard from "../../components/reports/GenerateReportCard";
import ReportsTable from "../../components/reports/ReportsTable";
import { Card, CardHeader, EmptyState, InlineError, Skeleton } from "../../components/ui/primitives";

import { useReports } from "../../hooks/useReports";
import { REPORT_TYPES } from "../../lib/reports";

const ReportsPage = () => {
    const { data, loading, refreshing, error, refetch } = useReports();
    const [typeFilter, setTypeFilter] = useState("all");

    const reports = (data ?? []).filter((r) => typeFilter === "all" || r.type === typeFilter);

    return (
        <div className="mx-auto max-w-275">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="mt-2 max-w-xl text-sm text-gray-500">
                    Generate summaries of your portfolio, spending, fraud activity and taxes, then
                    download them whenever you need.
                </p>
            </div>

            <div className="space-y-6">
                <GenerateReportCard onGenerated={refetch} />

                <Card>
                    <CardHeader
                        title="Your reports"
                        subtitle={data ? `${data.length} in total` : undefined}
                        action={
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                aria-label="Filter by report type"
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="all">All types</option>
                                {REPORT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        }
                    />

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
                            title="No reports yet"
                            message="Choose a report type above and select Generate report to create your first one."
                        />
                    ) : reports.length === 0 ? (
                        <EmptyState title="No reports of this type" message="Try another filter or generate a new report." />
                    ) : (
                        <div className={refreshing ? "opacity-70 transition-opacity" : "transition-opacity"}>
                            <ReportsTable reports={reports} onChanged={refetch} />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;