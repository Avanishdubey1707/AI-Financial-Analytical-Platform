import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-powered-financial-analytics-and.onrender.com";

const apiClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});


// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const isAuthRequest =
            originalRequest.url?.includes("/users/login") ||
            originalRequest.url?.includes("/users/register") ||
            originalRequest.url?.includes("/users/refresh-token") ||
            originalRequest.url?.includes("/users/current-user");

        /*
         * If protected API returns 401,
         * try refreshing access token.
         */

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthRequest
        ) {
            originalRequest._retry = true;

            try {
                await apiClient.post(
                    "/users/refresh-token"
                );

                return apiClient(originalRequest);
            } catch (refreshError) {
                window.location.replace("/login");

                return Promise.reject(
                    refreshError
                );
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;