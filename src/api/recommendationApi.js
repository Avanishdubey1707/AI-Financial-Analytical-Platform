import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const recommendationApi = axios.create({
    baseURL: `${API_URL}/api/v1/recommendations`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getRecommendations = async (params = {}) => {
    const response = await recommendationApi.get("/", {
        params,
    });

    return response.data;
};

export const generateRecommendations = async (data = {}) => {
    const response = await recommendationApi.post("/generate", data);

    return response.data;
};

export const getRecommendationById = async (id) => {
    const response = await recommendationApi.get(`/${id}`);

    return response.data;
};

export const dismissRecommendation = async (id) => {
    const response = await recommendationApi.delete(`/${id}`);

    return response.data;
};

export default recommendationApi;