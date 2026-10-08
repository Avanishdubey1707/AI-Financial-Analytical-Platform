import apiClient from "./apiClient";

// ============================================================
// GET ALL FORECASTS
// GET /api/v1/expense-forecasts
// ============================================================

export const getExpenseForecasts = async (params = {}) => {
    const response = await apiClient.get(
        "/expense-forecasts",
        {
            params,
        }
    );

    return response.data;
};


// ============================================================
// GENERATE FORECAST
// POST /api/v1/expense-forecasts/generate
// ============================================================

export const generateExpenseForecasts = async (
    data = {}
) => {
    const response = await apiClient.post(
        "/expense-forecasts/generate",
        data
    );

    return response.data;
};


// ============================================================
// GET SINGLE FORECAST
// GET /api/v1/expense-forecasts/:id
// ============================================================

export const getExpenseForecastById = async (id) => {
    const response = await apiClient.get(
        `/expense-forecasts/${id}`
    );

    return response.data;
};


// ============================================================
// FORECAST VS ACTUAL
// GET /api/v1/expense-forecasts/summary?month=YYYY-MM
// ============================================================

export const getExpenseForecastSummary = async (
    month
) => {
    const response = await apiClient.get(
        "/expense-forecasts/summary",
        {
            params: {
                month,
            },
        }
    );

    return response.data;
};