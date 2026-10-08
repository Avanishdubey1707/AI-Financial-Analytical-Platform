import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const fraudAlertApi = axios.create({
    baseURL: `${API_URL}/api/v1/fraud-alerts`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// ============================================================
// GET ALL FRAUD ALERTS
// GET /api/v1/fraud-alerts
// ============================================================

export const getFraudAlerts = async (params = {}) => {
    const response = await fraudAlertApi.get("/", {
        params,
    });

    return response.data;
};

// ============================================================
// GET SINGLE FRAUD ALERT
// GET /api/v1/fraud-alerts/:id
// ============================================================

export const getFraudAlertById = async (id) => {
    const response = await fraudAlertApi.get(`/${id}`);

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
    const response = await fraudAlertApi.put(
        `/${id}/status`,
        {
            status,
        }
    );

    return response.data;
};

export default fraudAlertApi;