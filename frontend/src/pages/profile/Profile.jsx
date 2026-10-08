import { useState } from "react";
import { LogOut } from "lucide-react";

import ProfileForm from "../../components/profile/ProfileForm";
import PasswordForm from "../../components/profile/PasswordForm";
import DeleteAccount from "../../components/profile/DeleteAccount";
import { Card, InlineError, Skeleton } from "../../components/ui/primitives";

import { useCurrentUser } from "../../hooks/useDashboardData";
import { logout } from "../../lib/auth";
import { formatDate } from "../../lib/format";

const initialsOf = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "?";

const ProfilePage = () => {
    const { data: user, loading, error, refetch } = useCurrentUser();
    const [signingOut, setSigningOut] = useState(false);

    const handleLogout = async () => {
        setSigningOut(true);
        await logout();
    };

    return (
        <div className="mx-auto max-w-275">
            {/* Page header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Manage your personal details and account security.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={signingOut}
                    className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-60"
                >
                    <LogOut size={16} />
                    {signingOut ? "Signing out…" : "Log out"}
                </button>
            </div>

            {loading ? (
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <Skeleton className="h-64 w-full" />
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-72 w-full" />
                    </div>
                </div>
            ) : error && !user ? (
                <InlineError error={error} onRetry={refetch} />
            ) : (
                <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    {/* Identity card */}
                    <Card className="text-center">
                        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
                            {initialsOf(user.name)}
                        </span>

                        <p className="mt-4 text-lg font-semibold text-gray-900">{user.name}</p>
                        <p className="break-all text-sm text-gray-500">{user.email}</p>

                        <dl className="mt-5 border-t border-gray-100 pt-4 text-left text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Member since</dt>
                                <dd className="font-medium text-gray-900">
                                    {formatDate(user.created_at, {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </dd>
                            </div>
                        </dl>
                    </Card>

                    {/* Forms */}
                    <div className="space-y-6">
                        <ProfileForm user={user} onSaved={refetch} />
                        <PasswordForm />
                        <DeleteAccount />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;