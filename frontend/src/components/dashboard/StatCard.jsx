const StatCard = ({
    title,
    value,
    change,
    description,
    icon: Icon,
    positive = true,
}) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Icon size={19} className="text-gray-700" />
                </div>

                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                >
                    {change}
                </span>
            </div>

            <p className="text-sm text-gray-500">{title}</p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight">
                {value}
            </h3>

            <p className="mt-2 text-xs text-gray-400">
                {description}
            </p>
        </div>
    );
};

export default StatCard;