import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const transactionApi = axios.create({
    baseURL: `${API_URL}/api/v1/transactions`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getTransactions = async (params = {}) => {
    const response = await transactionApi.get("/", {
        params,
    });

    return response.data;
};

export const addTransaction = async (data) => {
    const response = await transactionApi.post("/", data);

    return response.data;
};

export const getTransactionById = async (id) => {
    const response = await transactionApi.get(`/${id}`);

    return response.data;
};

export const updateTransaction = async (id, data) => {
    const response = await transactionApi.put(`/${id}`, data);

    return response.data;
};

export const deleteTransaction = async (id) => {
    const response = await transactionApi.delete(`/${id}`);

    return response.data;
};

export const getTransactionSummary = async (params = {}) => {
    const response = await transactionApi.get("/summary", {
        params,
    });

    return response.data;
};

export const checkTransactionFraud = async (id) => {
    const response = await transactionApi.get(
        `/${id}/check-fraud`
    );

    return response.data;
};

export default transactionApi;