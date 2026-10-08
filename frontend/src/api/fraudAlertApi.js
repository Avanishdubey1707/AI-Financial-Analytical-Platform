import apiClient from "./apiClient";

// ============================================================
// GET ALL FRAUD ALERTS
// GET /api/v1/fraud-alerts
// ============================================================

export const getFraudAlerts = async (params = {}) => {
    const response = await apiClient.get(
        "/fraud-alerts",
        {
            params,
        }
    );

    return response.data;
};


// ============================================================
// GET SINGLE FRAUD ALERT
// GET /api/v1/fraud-alerts/:id
// ============================================================

export const getFraudAlertById = async (id) => {
    const response = await apiClient.get(
        `/fraud-alerts/${id}`
    );

    return response.data;
};


// ============================================================
// UPDATE FRAUD ALERT STATUS
// PUT /api/v1/fraud-alerts/:id/status
// ============================================================

export const updateFraudAlertStatus = async (
    id,
    status
) => {
    const response = await apiClient.put(
        `/fraud-alerts/${id}/status`,
        {
            status,
        }
    );

    return response.data;
};