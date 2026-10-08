const inr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
});

export const formatINR = (n, { compact = false } = {}) =>
    (compact ? inrCompact : inr).format(Number(n) || 0);

export const formatPercent = (n, digits = 1) => {
    if (n === null || n === undefined || !Number.isFinite(n)) return "—";
    return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
};

export const pctChange = (current, previous) =>
    previous ? ((current - previous) / Math.abs(previous)) * 100 : null;

// Accepts 0–1 or 0–100 and returns 0–100.
export const toScore = (value) => {
    const n = Number(value) || 0;
    return n <= 1 ? n * 100 : n;
};

export const formatDate = (date, options = { day: "numeric", month: "short" }) =>
    date ? new Date(date).toLocaleDateString("en-IN", options) : "—";

export const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

export const todayLabel = () =>
    new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

export const formatDateTime = (date) =>
    date
        ? new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : "—";