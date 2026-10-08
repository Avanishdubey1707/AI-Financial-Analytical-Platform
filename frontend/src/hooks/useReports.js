import { useEffect } from "react";
import { api, toList } from "../lib/api";
import { createdAt, statusOf } from "../lib/reports";
import { useAsync } from "./useAsync";

const POLL_MS = 3000;

// Re-fetches every few seconds while something is still generating.
function usePollWhile(active, state) {
    const { refetch, data } = state;
    useEffect(() => {
        if (!active) return undefined;
        const timer = setTimeout(refetch, POLL_MS);
        return () => clearTimeout(timer);
    }, [active, data, refetch]);
}

export function useReports() {
    const state = useAsync(async () => {
        const list = toList(await api.get("/reports"));
        return [...list].sort((a, b) => new Date(createdAt(b)) - new Date(createdAt(a)));
    }, []);

    usePollWhile((state.data ?? []).some((r) => statusOf(r) === "pending"), state);
    return state;
}

export function useReport(id) {
    const state = useAsync(() => api.get(`/reports/${id}`), [id]);
    usePollWhile(state.data ? statusOf(state.data) === "pending" : false, state);
    return state;
}