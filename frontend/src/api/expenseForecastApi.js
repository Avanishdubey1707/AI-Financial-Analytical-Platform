import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const expenseForecastApi = axios.create({
    baseURL: `${API_URL}/api/v1/expense-forecasts`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// ============================================================
// GET ALL FORECASTS
// GET /api/v1/expense-forecasts
// ============================================================

export const getExpenseForecasts = async (
    params = {}
) => {
    const response = await expenseForecastApi.get(
        "/",
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
    const response =
        await expenseForecastApi.post(
            "/generate",
            data
        );

    return response.data;
};

// ============================================================
// GET SINGLE FORECAST
// GET /api/v1/expense-forecasts/:id
// ============================================================

export const getExpenseForecastById = async (
    id
) => {
    const response =
        await expenseForecastApi.get(
            `/${id}`
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
    const response =
        await expenseForecastApi.get(
            "/summary",
            {
                params: {
                    month,
                },
            }
        );

    return response.data;
};

export default expenseForecastApi;