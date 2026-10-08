import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getFraudAlertById,
    getFraudAlerts,
    updateFraudAlertStatus,
} from "../../api/fraudAlertApi";

import FraudAlertHeader from "../../components/fraudAlerts/FraudAlertHeader";
import FraudAlertFilters from "../../components/fraudAlerts/FraudAlertFilters";
import FraudAlertStats from "../../components/fraudAlerts/FraudAlertStats";
import FraudAlertList from "../../components/fraudAlerts/FraudAlertList";
import FraudAlertDetailsModal from "../../components/fraudAlerts/FraudAlertDetailsModal";
import FraudAlertEmptyState from "../../components/fraudAlerts/FraudAlertEmptyState";

const FraudAlertsPage = () => {
    const [alerts, setAlerts] = useState([]);

    const [status, setStatus] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [detailsLoading, setDetailsLoading] =
        useState(false);

    const [statusUpdating, setStatusUpdating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedAlert, setSelectedAlert] =
        useState(null);

    const [modalOpen, setModalOpen] =
        useState(false);

    // ==========================================================
    // Load alerts
    // ==========================================================

    const loadAlerts = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) {
                    setLoading(true);
                }

                setError("");

                const params = {
                    page: 1,
                    limit: 100,
                };

                if (status) {
                    params.status = status;
                }

                const response =
                    await getFraudAlerts(params);

                const data =
                    response?.data ||
                    response ||
                    {};

                setAlerts(
                    data.alerts ||
                    response?.alerts ||
                    []
                );
            } catch (err) {
                console.error(
                    "Failed to load fraud alerts:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    "Failed to load fraud alerts."
                );
            } finally {
                if (showLoader) {
                    setLoading(false);
                }
            }
        },
        [status]
    );

    // ==========================================================
    // Initial load / status filter
    // ==========================================================

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    // ==========================================================
    // Refresh
    // ==========================================================

    const handleRefresh = async () => {
        await loadAlerts();
    };

    // ==========================================================
    // View alert
    // ==========================================================

    const handleViewAlert = async (alert) => {
        try {
            setDetailsLoading(true);
            setError("");

            setModalOpen(true);

            const response =
                await getFraudAlertById(
                    alert._id
                );

            const data =
                response?.data ||
                response ||
                {};

            setSelectedAlert(
                data.alert
                    ? {
                        ...data.alert,
                        transaction:
                            data.transaction,
                    }
                    : alert
            );
        } catch (err) {
            console.error(
                "Failed to load fraud alert details:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to load fraud alert details."
            );

            setSelectedAlert(alert);
        } finally {
            setDetailsLoading(false);
        }
    };

    // ==========================================================
    // Update status
    // ==========================================================

    const handleStatusChange = async (
        alertId,
        nextStatus
    ) => {
        try {
            setStatusUpdating(true);
            setError("");

            const response =
                await updateFraudAlertStatus(
                    alertId,
                    nextStatus
                );

            const data =
                response?.data ||
                response ||
                {};

            const updatedAlert =
                data.alert ||
                null;

            // Update modal
            if (
                selectedAlert?._id === alertId
            ) {
                setSelectedAlert((current) => ({
                    ...current,
                    ...(updatedAlert || {}),
                    transaction:
                        current?.transaction,
                }));
            }

            // Update list immediately
            setAlerts((currentAlerts) =>
                currentAlerts.map((alert) =>
                    alert._id === alertId
                        ? {
                            ...alert,
                            ...(updatedAlert || {}),
                            status: nextStatus,
                        }
                        : alert
                )
            );

            // If a status filter is active,
            // reload so the item can disappear
            // if it no longer matches.
            if (status) {
                await loadAlerts(false);
            }
        } catch (err) {
            console.error(
                "Failed to update fraud alert status:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to update fraud alert status."
            );
        } finally {
            setStatusUpdating(false);
        }
    };

    // ==========================================================
    // Close modal
    // ==========================================================

    const handleCloseModal = () => {
        if (statusUpdating) {
            return;
        }

        setModalOpen(false);
        setSelectedAlert(null);
    };

    // ==========================================================
    // Clear filter
    // ==========================================================

    const handleClearFilter = () => {
        setStatus("");
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <FraudAlertHeader
                    onRefresh={handleRefresh}
                    loading={loading}
                />

                {/* Error */}
                {error && (
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{error}</span>

                        <button
                            onClick={() => setError("")}
                            className="shrink-0 font-medium hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Filters */}
                <FraudAlertFilters
                    status={status}
                    onStatusChange={setStatus}
                    onClear={handleClearFilter}
                />

                {/* Loading */}
                {loading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-32 animate-pulse rounded-2xl bg-slate-200"
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-52 animate-pulse rounded-2xl bg-slate-200"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <FraudAlertStats
                            alerts={alerts}
                        />

                        {/* Alerts */}
                        {alerts.length === 0 ? (
                            <FraudAlertEmptyState
                                hasFilter={Boolean(status)}
                                onClear={handleClearFilter}
                            />
                        ) : (
                            <FraudAlertList
                                alerts={alerts}
                                onView={handleViewAlert}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Details modal */}
            <FraudAlertDetailsModal
                open={modalOpen}
                alert={selectedAlert}
                loading={
                    detailsLoading ||
                    statusUpdating
                }
                onClose={handleCloseModal}
                onStatusChange={
                    handleStatusChange
                }
            />
        </>
    );
};

export default FraudAlertsPage;