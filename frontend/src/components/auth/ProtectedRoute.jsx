import { useEffect, useState } from "react";
import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { getCurrentUser } from "../../api/authApi";

const ProtectedRoute = () => {
    const location = useLocation();

    const [status, setStatus] =
        useState("checking");

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                await getCurrentUser();

                if (mounted) {
                    setStatus("authenticated");
                }
            } catch (error) {
                console.error(
                    "Authentication check failed:",
                    error
                );

                if (mounted) {
                    setStatus("unauthenticated");
                }
            }
        };

        checkAuth();

        return () => {
            mounted = false;
        };
    }, []);

    // ==========================================
    // CHECKING
    // ==========================================

    if (status === "checking") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

                    <p className="text-sm text-gray-500">
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // NOT AUTHENTICATED
    // ==========================================

    if (status === "unauthenticated") {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                }}
            />
        );
    }

    // ==========================================
    // AUTHENTICATED
    // ==========================================

    return <Outlet />;
};

export default ProtectedRoute;