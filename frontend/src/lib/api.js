

const BASE_URL = import.meta.env.VITE_API_URL ?? "https://ai-powered-financial-analytics-and.onrender.com";
const TOKEN_KEY = "access_token"; // change if your login flow stores it under another key

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

const safeParse = (text) => {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

async function request(path, { method = "GET", params, body, signal } = {}) {
    const url = new URL(`${BASE_URL}/api/v1${path}`, window.location.origin);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, value);
            }
        });
    }

    const token = getToken();

    const res = await fetch(url, {
        method,
        signal,
        headers: {
            Accept: "application/json",
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
        clearToken();
        if (window.location.pathname !== "/login") {
            window.location.assign("/login");
        }
        throw new ApiError("Your session has expired. Please sign in again.", 401);
    }

    const text = await res.text();
    const json = text ? safeParse(text) : null;

    if (!res.ok) {
        throw new ApiError(
            json?.message ?? json?.detail ?? json?.error ?? `Request failed (${res.status})`,
            res.status,
            json
        );
    }

    const isEnvelope =
        json && typeof json === "object" && !Array.isArray(json) && "data" in json;

    return isEnvelope ? json.data : json;
}

export const api = {
    get: (path, params, options) => request(path, { ...options, params }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
    del: (path, options) => request(path, { ...options, method: "DELETE" }),
};

// Accepts [..] or { items | results | points: [..] } and always returns an array.
export const toList = (res) =>
    Array.isArray(res) ? res : res?.items ?? res?.results ?? res?.points ?? [];

/* -------------------------------------------------------------------------- */
/* File downloads (sends the bearer token, then saves the blob)               */
/* -------------------------------------------------------------------------- */

const EXTENSIONS = {
    "application/pdf": "pdf",
    "text/csv": "csv",
    "application/json": "json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export async function downloadFile(path, fallbackName = "download") {
    const token = getToken();

    const res = await fetch(new URL(`${BASE_URL}${path}`, window.location.origin), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.status === 401) {
        clearToken();
        if (window.location.pathname !== "/login") window.location.assign("/login");
        throw new ApiError("Your session has expired. Please sign in again.", 401);
    }

    if (!res.ok) {
        const json = safeParse(await res.text());
        throw new ApiError(
            json?.message ?? json?.detail ?? json?.error ?? `Download failed (${res.status})`,
            res.status,
            json
        );
    }

    const blob = await res.blob();

    // Prefer the server's filename (Content-Disposition), else build one from the content type.
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const ext = EXTENSIONS[blob.type.split(";")[0]];
    const filename = match
        ? decodeURIComponent(match[1])
        : ext && !fallbackName.includes(".")
        ? `${fallbackName}.${ext}`
        : fallbackName;

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}