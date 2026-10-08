import { useMemo } from "react";
import { CircleDollarSign, CreditCard, PiggyBank, TrendingUp } from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import PortfolioChart from "../../components/dashboard/PortfolioChart";
import AIInsightCard from "../../components/dashboard/AIInsightCard";
import RiskCard from "../../components/dashboard/RiskCard";
import MarketWatchlist from "../../components/dashboard/MarketWatchlist";
import RecentTransactions from "../../components/dashboard/RecentTransactions";

import {
    isOpenAlert,
    useCashflow,
    useCurrentUser,
    useFraudAlerts,
    usePortfolioSummary,
    useRecentTransactions,
} from "../../hooks/useDashboardData";
import { formatINR, getGreeting, todayLabel } from "../../lib/format";

const DashboardPage = () => {
    // Shared data: each hook loads independently, so one failing endpoint
    // never blanks the whole page.
    const user = useCurrentUser();
    const portfolio = usePortfolioSummary();
    const cashflow = useCashflow();
    const transactions = useRecentTransactions(6);
    const alerts = useFraudAlerts();

    const firstName = user.data?.name?.split(" ")[0];
    const p = portfolio.data;
    const c = cashflow.data;

    const netWorth = p || c ? (p?.totalValue ?? 0) + (c?.balance ?? 0) : null;

    const openAlerts = useMemo(() => (alerts.data ?? []).filter(isOpenAlert), [alerts.data]);

    const flaggedIds = useMemo(
        () => new Set(openAlerts.map((a) => a.transaction_id)),
        [openAlerts]
    );

    const portfolioIds = useMemo(() => (p?.portfolios ?? []).map((x) => x.id), [p]);

    const monitoring = alerts.error && !alerts.data
        ? { dot: "bg-gray-400", label: "Monitoring unavailable" }
        : openAlerts.length > 0
        ? {
              dot: "bg-amber-500",
              label: `${openAlerts.length} alert${openAlerts.length > 1 ? "s" : ""} to review`,
          }
        : { dot: "bg-green-500", label: "AI monitoring active" };

    return (
        <div className="mx-auto max-w-400">
            {/* Page header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="mb-2 text-sm font-medium text-gray-400">{todayLabel()}</p>

                    <h1 className="text-3xl font-bold tracking-tight">
                        {getGreeting()}
                        {firstName ? `, ${firstName}` : ""} 👋
                    </h1>

                    <p className="mt-2 max-w-xl text-sm text-gray-500">
                        {alerts.loading
                            ? "Here's your financial overview."
                            : openAlerts.length > 0
                            ? `Here's your financial overview. Your AI copilot flagged ${openAlerts.length} item${openAlerts.length > 1 ? "s" : ""} worth your attention.`
                            : "Here's your financial overview. Your AI copilot didn't find anything that needs attention."}
                    </p>
                </div>

                <button
                    onClick={alerts.refetch}
                    className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50"
                >
                    <span className={`h-2 w-2 rounded-full ${monitoring.dot}`} />
                    {monitoring.label}
                </button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total net worth"
                    value={netWorth !== null ? formatINR(netWorth) : "—"}
                    description="investments + cash balance"
                    icon={CircleDollarSign}
                    loading={portfolio.loading || cashflow.loading}
                    error={Boolean(portfolio.error && cashflow.error)}
                />

                <StatCard
                    title="Investments"
                    value={formatINR(p?.totalValue)}
                    change={p?.returnPct}
                    description="overall returns"
                    icon={TrendingUp}
                    loading={portfolio.loading}
                    error={Boolean(portfolio.error && !p)}
                />

                <StatCard
                    title="Monthly expenses"
                    value={formatINR(c?.expenses)}
                    change={c?.expensesChange}
                    description="vs. previous month"
                    icon={CreditCard}
                    positiveIsGood={false}
                    loading={cashflow.loading}
                    error={Boolean(cashflow.error && !c)}
                />

                <StatCard
                    title="Savings rate"
                    value={c?.savingsRate != null ? `${c.savingsRate.toFixed(1)}%` : "—"}
                    change={c?.savingsRateChange}
                    description="of this month's income"
                    icon={PiggyBank}
                    loading={cashflow.loading}
                    error={Boolean(cashflow.error && !c)}
                />
            </div>

            {/* Main analytics */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <PortfolioChart portfolioIds={portfolioIds} portfolioLoading={portfolio.loading} />

                <AIInsightCard />
            </div>

            {/* Risk + Market */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <RiskCard alertsState={alerts} portfolioState={portfolio} />

                <MarketWatchlist />
            </div>

            {/* Transactions */}
            <div className="mt-6">
                <RecentTransactions state={transactions} flaggedIds={flaggedIds} />
            </div>
        </div>
    );
};

export default DashboardPage;