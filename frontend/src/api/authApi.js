import apiClient from "./apiClient";


// ======================================================
// REGISTER
// ======================================================

export const registerUser = async (data) => {
    const response = await apiClient.post(
        "/users/register",
        data
    );

    return response.data;
};


// ======================================================
// LOGIN
// ======================================================

export const loginUser = async (data) => {
    const response = await apiClient.post(
        "/users/login",
        data
    );

    return response.data;
};


// ======================================================
// LOGOUT
// ======================================================

export const logoutUser = async () => {
    const response = await apiClient.post(
        "/users/logout"
    );

    return response.data;
};


// ======================================================
// CURRENT USER
// ======================================================

export const getCurrentUser = async () => {
    const response = await apiClient.get(
        "/users/current-user"
    );

    return response.data;
};


// ======================================================
// REFRESH TOKEN
// ======================================================

export const refreshAccessToken = async () => {
    const response = await apiClient.post(
        "/users/refresh-token"
    );

    return response.data;
};


// ======================================================
// CHANGE PASSWORD
// ======================================================

export const changePassword = async (data) => {
    const response = await apiClient.put(
        "/users/change-password",
        data
    );

    return response.data;
};