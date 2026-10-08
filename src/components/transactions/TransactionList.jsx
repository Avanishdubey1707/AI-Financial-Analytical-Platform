import TransactionCard from "./TransactionCard";

const TransactionList = ({
    transactions = [],
    onView,
    onEdit,
    onDelete,
}) => {
    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {transactions.map((transaction) => (
                <TransactionCard
                    key={transaction._id}
                    transaction={transaction}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default TransactionList;