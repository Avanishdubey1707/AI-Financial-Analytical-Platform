import {
    ArrowDownRight,
    ArrowUpRight,
    Receipt,
    ShieldAlert,
} from "lucide-react";

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;

const TransactionStats = ({
    transactions = [],
    overallTotals = {},
}) => {
    const income =
        Number(overallTotals.income) ||
        transactions
            .filter((item) => item.type === "income")
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expense =
        Number(overallTotals.expense) ||
        transactions
            .filter((item) => item.type === "expense")
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const fraudCount = transactions.filter(
        (item) => item.fraudAlert
    ).length;

    const stats = [
        {
            title: "Transactions",
            value: transactions.length,
            icon: Receipt,
            className: "bg-indigo-50 text-indigo-600",
        },
        {
            title: "Income",
            value: formatCurrency(income),
            icon: ArrowUpRight,
            className: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Expenses",
            value: formatCurrency(expense),
            icon: ArrowDownRight,
            className: "bg-red-50 text-red-600",
        },
        {
            title: "Fraud Alerts",
            value: fraudCount,
            icon: ShieldAlert,
            className: "bg-amber-50 text-amber-600",
        },
    ];

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.title}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">
                                    {stat.title}
                                </p>

                                <p className="mt-2 text-xl font-bold text-gray-900">
                                    {stat.value}
                                </p>
                            </div>

                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.className}`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionStats;