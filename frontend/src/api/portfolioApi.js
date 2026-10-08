import apiClient from "./apiClient";

// ============================================================
// GET ALL PORTFOLIOS
// GET /api/v1/portfolios
// ============================================================

export const getPortfolios = async () => {
    const response = await apiClient.get(
        "/portfolios"
    );

    return response.data;
};


// ============================================================
// CREATE PORTFOLIO
// POST /api/v1/portfolios
// ============================================================

export const createPortfolio = async (data) => {
    const response = await apiClient.post(
        "/portfolios",
        data
    );

    return response.data;
};


// ============================================================
// GET SINGLE PORTFOLIO
// GET /api/v1/portfolios/:id
// ============================================================

export const getPortfolio = async (
    portfolioId
) => {
    const response = await apiClient.get(
        `/portfolios/${portfolioId}`
    );

    return response.data;
};


// ============================================================
// UPDATE PORTFOLIO
// PATCH /api/v1/portfolios/:id
// ============================================================

export const updatePortfolio = async (
    portfolioId,
    data
) => {
    const response = await apiClient.patch(
        `/portfolios/${portfolioId}`,
        data
    );

    return response.data;
};


// ============================================================
// DELETE PORTFOLIO
// DELETE /api/v1/portfolios/:id
// ============================================================

export const deletePortfolio = async (
    portfolioId
) => {
    const response = await apiClient.delete(
        `/portfolios/${portfolioId}`
    );

    return response.data;
};


// ============================================================
// GET PORTFOLIO HOLDINGS
// GET /api/v1/portfolios/:id/holdings
// ============================================================

export const getPortfolioHoldings = async (
    portfolioId
) => {
    const response = await apiClient.get(
        `/portfolios/${portfolioId}/holdings`
    );

    return response.data;
};


// ============================================================
// ADD HOLDING
// POST /api/v1/portfolios/:id/holdings
// ============================================================

export const addHolding = async (
    portfolioId,
    data
) => {
    const response = await apiClient.post(
        `/portfolios/${portfolioId}/holdings`,
        data
    );

    return response.data;
};


// ============================================================
// UPDATE HOLDING
// PATCH /api/v1/portfolios/:id/holdings/:holdingId
// ============================================================

export const updateHolding = async (
    portfolioId,
    holdingId,
    data
) => {
    const response = await apiClient.patch(
        `/portfolios/${portfolioId}/holdings/${holdingId}`,
        data
    );

    return response.data;
};


// ============================================================
// DELETE HOLDING
// DELETE /api/v1/portfolios/:id/holdings/:holdingId
// ============================================================

export const deleteHolding = async (
    portfolioId,
    holdingId
) => {
    const response = await apiClient.delete(
        `/portfolios/${portfolioId}/holdings/${holdingId}`
    );

    return response.data;
};


// ============================================================
// GET PORTFOLIO VALUE
// GET /api/v1/portfolios/:id/value
// ============================================================

export const getPortfolioValue = async (
    portfolioId
) => {
    const response = await apiClient.get(
        `/portfolios/${portfolioId}/value`
    );

    return response.data;
};


// ============================================================
// GET PORTFOLIO PERFORMANCE
// GET /api/v1/portfolios/:id/performance
// ============================================================

export const getPortfolioPerformance = async (
    portfolioId,
    params = {}
) => {
    const response = await apiClient.get(
        `/portfolios/${portfolioId}/performance`,
        {
            params,
        }
    );

    return response.data;
};