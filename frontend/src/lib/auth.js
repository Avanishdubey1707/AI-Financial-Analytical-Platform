import { api, clearToken } from "./api";

// Invalidates the token on the server (POST /users/logout), then clears it locally.
// Even if the server call fails (e.g. the token already expired) the user is still signed out here.
export async function logout() {
    try {
        await api.post("/users/logout");
    } catch {
        // ignore: we sign out locally either way
    }
    clearToken();
    window.location.assign("/login");
}