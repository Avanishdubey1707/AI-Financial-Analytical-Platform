import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const portfolioApi = axios.create({
    baseURL: `${API_URL}/api/v1/portfolios`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getPortfolios = async () => {
    const response = await portfolioApi.get("/");
    return response.data;
};

export const createPortfolio = async (data) => {
    const response = await portfolioApi.post("/", data);
    return response.data;
};

export const getPortfolio = async (portfolioId) => {
    const response = await portfolioApi.get(`/${portfolioId}`);
    return response.data;
};

export const updatePortfolio = async (
    portfolioId,
    data
) => {
    const response = await portfolioApi.patch(
        `/${portfolioId}`,
        data
    );

    return response.data;
};

export const deletePortfolio = async (
    portfolioId
) => {
    const response = await portfolioApi.delete(
        `/${portfolioId}`
    );

    return response.data;
};

export const getPortfolioHoldings = async (
    portfolioId
) => {
    const response = await portfolioApi.get(
        `/${portfolioId}/holdings`
    );

    return response.data;
};

export const addHolding = async (
    portfolioId,
    data
) => {
    const response = await portfolioApi.post(
        `/${portfolioId}/holdings`,
        data
    );

    return response.data;
};

export const updateHolding = async (
    portfolioId,
    holdingId,
    data
) => {
    const response = await portfolioApi.patch(
        `/${portfolioId}/holdings/${holdingId}`,
        data
    );

    return response.data;
};

export const deleteHolding = async (
    portfolioId,
    holdingId
) => {
    const response = await portfolioApi.delete(
        `/${portfolioId}/holdings/${holdingId}`
    );

    return response.data;
};

export const getPortfolioValue = async (
    portfolioId
) => {
    const response = await portfolioApi.get(
        `/${portfolioId}/value`
    );

    return response.data;
};

export const getPortfolioPerformance = async (
    portfolioId,
    params = {}
) => {
    const response = await portfolioApi.get(
        `/${portfolioId}/performance`,
        {
            params,
        }
    );

    return response.data;
};

export default portfolioApi;