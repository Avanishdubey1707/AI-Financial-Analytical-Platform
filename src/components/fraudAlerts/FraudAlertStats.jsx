import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    ShieldCheck,
} from "lucide-react";

const FraudAlertStats = ({ alerts }) => {
    const pending = alerts.filter(
        (alert) => alert.status === "PENDING"
    ).length;

    const reviewed = alerts.filter(
        (alert) => alert.status === "REVIEWED"
    ).length;

    const confirmed = alerts.filter(
        (alert) => alert.status === "CONFIRMED"
    ).length;

    const dismissed = alerts.filter(
        (alert) => alert.status === "DISMISSED"
    ).length;

    const stats = [
        {
            title: "Total Alerts",
            value: alerts.length,
            subtitle: "Detected alerts",
            icon: AlertTriangle,
            iconClass:
                "bg-red-50 text-red-600",
        },
        {
            title: "Pending Review",
            value: pending,
            subtitle: "Need your attention",
            icon: Clock3,
            iconClass:
                "bg-amber-50 text-amber-600",
        },
        {
            title: "Confirmed",
            value: confirmed,
            subtitle: "Confirmed fraud",
            icon: CheckCircle2,
            iconClass:
                "bg-red-50 text-red-600",
        },
        {
            title: "Dismissed",
            value: dismissed,
            subtitle: "Marked safe",
            icon: ShieldCheck,
            iconClass:
                "bg-emerald-50 text-emerald-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    {stat.title}
                                </p>

                                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                    {stat.value}
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    {stat.subtitle}
                                </p>
                            </div>

                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                            >
                                <Icon size={19} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FraudAlertStats;