import {
    Bell,
    ChevronDown,
    LogOut,
    Search,
    Settings,
    Sparkles,
    User,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getCurrentUser,
    logoutUser,
} from "../../api/authApi";

const Topbar = () => {
    const navigate = useNavigate();

    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    const [user, setUser] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] =
        useState(false);

    const [loadingUser, setLoadingUser] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    // ==========================================
    // GET CURRENT USER
    // ==========================================

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await getCurrentUser();

                /*
                 * Your ApiResponse appears to return:
                 *
                 * {
                 *   statusCode,
                 *   message,
                 *   data: {
                 *      user: {...}
                 *   }
                 * }
                 */

                setUser(response?.data?.user || null);
            } catch (error) {
                console.error(
                    "Failed to fetch current user:",
                    error
                );

                // User isn't authenticated
                if (error.response?.status === 401) {
                    navigate("/login");
                }
            } finally {
                setLoadingUser(false);
            }
        };

        loadUser();
    }, [navigate]);

    // ==========================================
    // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
    // ==========================================

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }

            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setNotificationOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = async () => {
        if (loggingOut) return;

        try {
            setLoggingOut(true);

            await logoutUser();

            setUser(null);
            setProfileOpen(false);

            navigate("/login", {
                replace: true,
            });
        } catch (error) {
            console.error("Logout failed:", error);

            /*
             * Even if the server request fails,
             * send the user back to login.
             */
            navigate("/login", {
                replace: true,
            });
        } finally {
            setLoggingOut(false);
        }
    };

    // ==========================================
    // USER DETAILS
    // ==========================================

    const getInitials = () => {
        if (!user?.name) return "U";

        return user.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((name) => name[0])
            .join("")
            .toUpperCase();
    };

    const displayName = user?.name || "User";

    const displayEmail =
        user?.email || "your@email.com";

    return (
        <header className="sticky top-0 z-30 h-[76px] border-b border-gray-200 bg-white/90 backdrop-blur">
            <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

                {/* ===================================== */}
                {/* SEARCH */}
                {/* ===================================== */}

                <div className="hidden w-full max-w-xl md:block">
                    <div className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus-within:border-gray-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-100">
                        <Search
                            size={17}
                            className="text-gray-400 transition group-focus-within:text-gray-700"
                        />

                        <input
                            type="text"
                            placeholder="Search transactions, stocks, reports..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* ===================================== */}
                {/* RIGHT ACTIONS */}
                {/* ===================================== */}

                <div className="ml-auto flex items-center gap-2 sm:gap-3">

                    {/* AI BUTTON */}

                    <button
                        onClick={() => navigate("/recommendations")}
                        className="hidden items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98] sm:flex"
                    >
                        <Sparkles size={15} />

                        <span>Ask AI</span>
                    </button>

                    {/* ================================= */}
                    {/* NOTIFICATIONS */}
                    {/* ================================= */}

                    <div
                        ref={notificationRef}
                        className="relative"
                    >
                        <button
                            onClick={() => {
                                setNotificationOpen(
                                    !notificationOpen
                                );

                                setProfileOpen(false);
                            }}
                            className={`relative rounded-xl border p-2.5 transition ${notificationOpen
                                    ? "border-gray-300 bg-gray-100"
                                    : "border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <Bell size={18} />

                            {/* notification dot */}
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                        </button>

                        {notificationOpen && (
                            <div className="absolute right-0 mt-3 w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Notifications
                                        </h3>

                                        <p className="mt-0.5 text-xs text-gray-400">
                                            Your latest alerts
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                                        2 new
                                    </span>
                                </div>

                                <div>
                                    <div className="flex gap-3 border-b border-gray-100 p-4 hover:bg-gray-50">
                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                                        <div>
                                            <p className="text-sm font-medium">
                                                Unusual transaction detected
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-gray-400">
                                                AI detected an unusual spending
                                                pattern in your account.
                                            </p>

                                            <p className="mt-2 text-[10px] text-gray-400">
                                                12 minutes ago
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 p-4 hover:bg-gray-50">
                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />

                                        <div>
                                            <p className="text-sm font-medium">
                                                Portfolio insight available
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-gray-400">
                                                Your AI copilot has a new
                                                recommendation.
                                            </p>

                                            <p className="mt-2 text-[10px] text-gray-400">
                                                1 hour ago
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() =>
                                        navigate("/fraud-alerts")
                                    }
                                    className="w-full border-t border-gray-100 px-4 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ================================= */}
                    {/* PROFILE */}
                    {/* ================================= */}

                    <div
                        ref={profileRef}
                        className="relative"
                    >
                        <button
                            onClick={() => {
                                setProfileOpen(!profileOpen);
                                setNotificationOpen(false);
                            }}
                            className={`flex items-center gap-2 rounded-xl border p-1.5 pr-2 transition ${profileOpen
                                    ? "border-gray-300 bg-gray-50"
                                    : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            {/* Avatar */}

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white">
                                {loadingUser ? "..." : getInitials()}
                            </div>

                            {/* User name */}

                            <div className="hidden text-left lg:block">
                                <p className="max-w-[120px] truncate text-xs font-semibold text-gray-900">
                                    {loadingUser
                                        ? "Loading..."
                                        : displayName}
                                </p>

                                <p className="text-[10px] text-gray-400">
                                    Personal account
                                </p>
                            </div>

                            <ChevronDown
                                size={15}
                                className={`hidden text-gray-400 transition lg:block ${profileOpen
                                        ? "rotate-180"
                                        : ""
                                    }`}
                            />
                        </button>

                        {/* PROFILE DROPDOWN */}

                        {profileOpen && (
                            <div className="absolute right-0 mt-3 w-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

                                {/* User header */}

                                <div className="border-b border-gray-100 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
                                            {getInitials()}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {displayName}
                                            </p>

                                            <p className="truncate text-xs text-gray-400">
                                                {displayEmail}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu */}

                                <div className="p-2">

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            navigate("/settings");
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        <User size={17} />

                                        <span>Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            navigate("/settings");
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        <Settings size={17} />

                                        <span>Settings</span>
                                    </button>
                                </div>

                                {/* Logout */}

                                <div className="border-t border-gray-100 p-2">
                                    <button
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <LogOut size={17} />

                                        <span>
                                            {loggingOut
                                                ? "Logging out..."
                                                : "Logout"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;