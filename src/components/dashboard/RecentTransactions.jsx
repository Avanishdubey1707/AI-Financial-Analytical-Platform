const transactions = [
    {
        name: "Amazon India",
        category: "Shopping",
        date: "Today, 10:42 AM",
        amount: "-₹2,840",
    },
    {
        name: "Salary Credit",
        category: "Income",
        date: "Yesterday",
        amount: "+₹85,000",
    },
    {
        name: "Zerodha",
        category: "Investment",
        date: "Sep 28",
        amount: "-₹12,500",
    },
    {
        name: "Swiggy",
        category: "Food",
        date: "Sep 27",
        amount: "-₹640",
    },
];

const RecentTransactions = () => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div>
                    <h3 className="font-semibold">
                        Recent transactions
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                        Your latest financial activity
                    </p>
                </div>

                <button className="text-xs font-semibold text-gray-500 hover:text-gray-900">
                    View all
                </button>
            </div>

            <div className="divide-y divide-gray-100">
                {transactions.map((transaction) => {
                    const income = transaction.amount.startsWith("+");

                    return (
                        <div
                            key={`${transaction.name}-${transaction.date}`}
                            className="flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold">
                                    {transaction.name.charAt(0)}
                                </div>

                                <div>
                                    <p className="text-sm font-medium">
                                        {transaction.name}
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {transaction.category} ·{" "}
                                        {transaction.date}
                                    </p>
                                </div>
                            </div>

                            <p
                                className={`text-sm font-semibold ${income
                                        ? "text-green-600"
                                        : "text-gray-900"
                                    }`}
                            >
                                {transaction.amount}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentTransactions;