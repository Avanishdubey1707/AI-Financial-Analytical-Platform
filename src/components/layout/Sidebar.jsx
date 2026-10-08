import {
    BarChart3,
    BrainCircuit,
    ChevronDown,
    CircleDollarSign,
    CreditCard,
    LayoutDashboard,
    LineChart,
    LogOut,
    PieChart,
    Receipt,
    Settings,
    ShieldAlert,
    Sparkles,
    Wallet,
    X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useState } from "react";

const navigation = [
    {
        label: "Overview",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Portfolio",
        path: "/portfolio",
        icon: PieChart,
    },
    {
        label: "Transactions",
        path: "/transactions",
        icon: Receipt,
    },
    {
        label: "Market",
        path: "/market",
        icon: LineChart,
    },
    {
        label: "AI Predictions",
        path: "/predictions",
        icon: BrainCircuit,
    },
    {
        label: "Recommendations",
        path: "/recommendations",
        icon: Sparkles,
    },
    {
        label: "Fraud Alerts",
        path: "/fraud-alerts",
        icon: ShieldAlert,
    },
];

const bottomNavigation = [
    {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
    },
    {
        label: "Settings",
        path: "/settings",
        icon: Settings,
    },
];

const Sidebar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItem = (item) => {
        const Icon = item.icon;

        return (
            <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`
                }
            >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
            </NavLink>
        );
    };

    return (
        <>
            {/* Mobile button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-40 rounded-lg border bg-white p-2 shadow-sm lg:hidden"
            >
                <LayoutDashboard size={20} />
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }`}
            >
                {/* Logo */}
                <div className="flex h-[76px] items-center justify-between border-b border-gray-100 px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
                            <CircleDollarSign
                                size={20}
                                className="text-white"
                            />
                        </div>

                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                FinSight
                            </h1>

                            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
                                AI Finance
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* AI badge */}
                <div className="mx-4 mt-5 rounded-2xl bg-gray-900 p-4 text-white">
                    <div className="mb-3 flex items-center gap-2">
                        <Sparkles size={16} />

                        <span className="text-xs font-semibold">
                            AI Financial Copilot
                        </span>
                    </div>

                    <p className="text-xs leading-5 text-gray-400">
                        Your portfolio is being analyzed continuously
                        for opportunities and risks.
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Workspace
                    </p>

                    <nav className="space-y-1">
                        {navigation.map(navItem)}
                    </nav>

                    <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Manage
                    </p>

                    <nav className="space-y-1">
                        {bottomNavigation.map(navItem)}
                    </nav>
                </div>

                {/* User */}
                <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold">
                            AY
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                Anurag Yadav
                            </p>

                            <p className="truncate text-xs text-gray-400">
                                Personal account
                            </p>
                        </div>

                        <ChevronDown size={16} className="text-gray-400" />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;