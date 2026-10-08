import {
    CircleDollarSign,
    CreditCard,
    PiggyBank,
    TrendingUp,
} from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import PortfolioChart from "../../components/dashboard/PortfolioChart";
import AIInsightCard from "../../components/dashboard/AIInsightCard";
import RiskCard from "../../components/dashboard/RiskCard";
import MarketWatchlist from "../../components/dashboard/MarketWatchlist";
import RecentTransactions from "../../components/dashboard/RecentTransactions";

const DashboardPage = () => {
    return (
        <div className="mx-auto max-w-[1600px]">
            {/* Page header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="mb-2 text-sm font-medium text-gray-400">
                        Wednesday, October 8
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Good morning, Anurag 👋
                    </h1>

                    <p className="mt-2 max-w-xl text-sm text-gray-500">
                        Here's your financial overview. Your AI
                        copilot has analyzed your portfolio and found
                        a few things worth your attention.
                    </p>
                </div>

                <button className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    AI monitoring active
                </button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total net worth"
                    value="₹18,42,680"
                    change="+8.4%"
                    description="vs. previous month"
                    icon={CircleDollarSign}
                />

                <StatCard
                    title="Investments"
                    value="₹12,84,520"
                    change="+12.48%"
                    description="portfolio performance"
                    icon={TrendingUp}
                />

                <StatCard
                    title="Monthly expenses"
                    value="₹42,860"
                    change="-6.2%"
                    description="vs. previous month"
                    icon={CreditCard}
                />

                <StatCard
                    title="Savings rate"
                    value="51.2%"
                    change="+4.8%"
                    description="above your target"
                    icon={PiggyBank}
                />
            </div>

            {/* Main analytics */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <PortfolioChart />

                <AIInsightCard />
            </div>

            {/* Risk + Market */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <RiskCard />

                <MarketWatchlist />
            </div>

            {/* Transactions */}
            <div className="mt-6">
                <RecentTransactions />
            </div>
        </div>
    );
};

export default DashboardPage;