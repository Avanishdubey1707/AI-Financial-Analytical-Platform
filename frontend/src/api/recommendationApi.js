import apiClient from "./apiClient";

// ============================================================
// GET ALL RECOMMENDATIONS
// GET /api/v1/recommendations
// ============================================================

export const getRecommendations = async (params = {}) => {
    const response = await apiClient.get(
        "/recommendations",
        {
            params,
        }
    );

    return response.data;
};


// ============================================================
// GENERATE RECOMMENDATIONS
// POST /api/v1/recommendations/generate
// ============================================================

export const generateRecommendations = async (
    data = {}
) => {
    const response = await apiClient.post(
        "/recommendations/generate",
        data
    );

    return response.data;
};


// ============================================================
// GET SINGLE RECOMMENDATION
// GET /api/v1/recommendations/:id
// ============================================================

export const getRecommendationById = async (id) => {
    const response = await apiClient.get(
        `/recommendations/${id}`
    );

    return response.data;
};


// ============================================================
// DISMISS RECOMMENDATION
// DELETE /api/v1/recommendations/:id
// ============================================================

export const dismissRecommendation = async (id) => {
    const response = await apiClient.delete(
        `/recommendations/${id}`
    );

    return response.data;
};