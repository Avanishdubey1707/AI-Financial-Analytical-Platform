import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const authApi = axios.create({
    baseURL: `${API_URL}/api/v1/users`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// ================================
// REGISTER
// ================================
export const registerUser = async (data) => {
    const response = await authApi.post("/register", data);
    return response.data;
};

// ================================
// LOGIN
// ================================
export const loginUser = async (data) => {
    const response = await authApi.post("/login", data);
    return response.data;
};

// ================================
// LOGOUT
// ================================
export const logoutUser = async () => {
    const response = await authApi.post("/logout");
    return response.data;
};

// ================================
// CURRENT USER
// ================================
export const getCurrentUser = async () => {
    const response = await authApi.get("/current-user");
    return response.data;
};

// ================================
// REFRESH TOKEN
// ================================
export const refreshAccessToken = async () => {
    const response = await authApi.post("/refresh-token");
    return response.data;
};

// ================================
// CHANGE PASSWORD
// ================================
export const changePassword = async (data) => {
    const response = await authApi.put(
        "/change-password",
        data
    );

    return response.data;
};

export default authApi;