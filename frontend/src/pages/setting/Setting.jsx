import { useEffect, useState } from "react";
import { Bell, Brain, Eye, RotateCcw } from "lucide-react";

import { ApiError, api } from "../../lib/api";
import { useAsync } from "../../hooks/useAsync";
import { Card, CardHeader, InlineError, Skeleton } from "../../components/ui/primitives";

/* -------------------------------------------------------------------------- */
/* Settings shape + persistence                                               */
/* -------------------------------------------------------------------------- */

const DEFAULTS = {
    notifications: {
        fraudEmail: true,
        fraudInApp: true,
        recommendations: true,
        weeklyReport: false,
        marketMoves: false,
    },
    ai: {
        riskTolerance: "balanced", // conservative | balanced | aggressive
        fraudThreshold: 60, // alert when risk score >= this (0-100)
        forecastMonths: 3, // 1 | 3 | 6
        autoRecommendations: true,
    },
    display: {
        defaultRange: "1M", // 1W | 1M | 3M | 1Y
        hideBalances: false,
    },
};

// Other pages can read the same settings from localStorage under this key.
const STORAGE_KEY = "finance_settings";

const merge = (saved) =>
    Object.fromEntries(
        Object.entries(DEFAULTS).map(([section, values]) => [
            section,
            { ...values, ...(saved?.[section] ?? {}) },
        ])
    );

const readLocal = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        return null;
    }
};

const writeLocal = (settings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // storage can be unavailable (private mode); the server copy still counts
    }
};

// Tries GET /users/me/settings. If the backend has no such endpoint yet,
// falls back to the copy stored on this device.
async function loadSettings() {
    try {
        const remote = await api.get("/users/me/settings");
        const settings = merge(remote);
        writeLocal(settings);
        return settings;
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) throw err;
        return merge(readLocal());
    }
}

// Returns "server" when saved through the API, "device" when only stored locally.
async function saveSettings(settings) {
    try {
        await api.put("/users/me/settings", settings);
        writeLocal(settings);
        return "server";
    } catch (err) {
        if (err instanceof ApiError && [404, 405].includes(err.status)) {
            writeLocal(settings);
            return "device";
        }
        throw err;
    }
}

/* -------------------------------------------------------------------------- */
/* Small UI pieces                                                            */
/* -------------------------------------------------------------------------- */

const Toggle = ({ checked, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
            checked ? "bg-indigo-600" : "bg-gray-200"
        }`}
    >
        <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                checked ? "translate-x-5" : ""
            }`}
        />
    </button>
);

const Segmented = ({ value, options, onChange, label }) => (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-gray-100 p-1">
        {options.map((option) => (
            <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={value === option.value}
                onClick={() => onChange(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    value === option.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                }`}
            >
                {option.label}
            </button>
        ))}
    </div>
);

const Row = ({ title, description, children }) => (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="max-w-md">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

const TABS = [
    {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        title: "Notifications",
        subtitle: "Choose what we tell you about, and where.",
    },
    {
        id: "ai",
        label: "AI & risk",
        icon: Brain,
        title: "AI & risk",
        subtitle: "Tune how the AI scores risk and builds suggestions for you.",
    },
    {
        id: "display",
        label: "Display & privacy",
        icon: Eye,
        title: "Display & privacy",
        subtitle: "Control what the dashboard shows by default.",
    },
];

const SettingsPage = () => {
    const { data, loading, error, refetch } = useAsync(loadSettings, []);

    const [tab, setTab] = useState("notifications");
    const [saved, setSaved] = useState(null); // last persisted settings
    const [draft, setDraft] = useState(null); // what's on screen
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type, text }

    useEffect(() => {
        if (data) {
            setSaved(data);
            setDraft(data);
        }
    }, [data]);

    const dirty = draft && saved && JSON.stringify(draft) !== JSON.stringify(saved);

    const set = (section, key) => (value) => {
        setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: value } }));
        setMessage(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const where = await saveSettings(draft);
            setSaved(draft);
            setMessage({
                type: "success",
                text:
                    where === "server"
                        ? "Settings saved."
                        : "Saved on this device. Your server has no settings endpoint yet, so they won't follow you to other devices.",
            });
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setDraft(saved);
        setMessage(null);
    };

    const handleReset = () => {
        setDraft(merge(null));
        setMessage(null);
    };

    const active = TABS.find((t) => t.id === tab);
    const n = draft?.notifications;
    const ai = draft?.ai;
    const display = draft?.display;

    return (
        <div className="mx-auto max-w-275">
            {/* Page header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Set how alerts, AI suggestions and the dashboard work for you.
                    </p>
                </div>

                <button
                    onClick={handleReset}
                    disabled={!draft}
                    className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                    <RotateCcw size={15} />
                    Reset to defaults
                </button>
            </div>

            {loading ? (
                <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            ) : error && !draft ? (
                <InlineError error={error} onRetry={refetch} />
            ) : (
                draft && (
                    <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                        {/* Section nav */}
                        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setTab(id)}
                                    aria-current={tab === id ? "page" : undefined}
                                    className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                        tab === id
                                            ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </nav>

                        {/* Section content */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader title={active.title} subtitle={active.subtitle} />

                                {tab === "notifications" && (
                                    <div className="divide-y divide-gray-100">
                                        <Row
                                            title="Fraud alerts by email"
                                            description="Get an email when a transaction looks suspicious."
                                        >
                                            <Toggle
                                                label="Fraud alerts by email"
                                                checked={n.fraudEmail}
                                                onChange={set("notifications", "fraudEmail")}
                                            />
                                        </Row>
                                        <Row
                                            title="Fraud alerts in the app"
                                            description="Show suspicious transactions on your dashboard as soon as they're detected."
                                        >
                                            <Toggle
                                                label="Fraud alerts in the app"
                                                checked={n.fraudInApp}
                                                onChange={set("notifications", "fraudInApp")}
                                            />
                                        </Row>
                                        <Row
                                            title="New recommendations"
                                            description="Tell me when the AI has a new buy, sell or hold suggestion for my holdings."
                                        >
                                            <Toggle
                                                label="New recommendations"
                                                checked={n.recommendations}
                                                onChange={set("notifications", "recommendations")}
                                            />
                                        </Row>
                                        <Row
                                            title="Big market moves"
                                            description="Notify me when a stock I hold moves sharply in a day."
                                        >
                                            <Toggle
                                                label="Big market moves"
                                                checked={n.marketMoves}
                                                onChange={set("notifications", "marketMoves")}
                                            />
                                        </Row>
                                        <Row
                                            title="Weekly summary"
                                            description="Email me a portfolio and spending summary once a week."
                                        >
                                            <Toggle
                                                label="Weekly summary"
                                                checked={n.weeklyReport}
                                                onChange={set("notifications", "weeklyReport")}
                                            />
                                        </Row>
                                    </div>
                                )}

                                {tab === "ai" && (
                                    <div className="divide-y divide-gray-100">
                                        <Row
                                            title="Risk tolerance"
                                            description="Shapes which stocks and actions the AI suggests to you."
                                        >
                                            <Segmented
                                                label="Risk tolerance"
                                                value={ai.riskTolerance}
                                                onChange={set("ai", "riskTolerance")}
                                                options={[
                                                    { value: "conservative", label: "Conservative" },
                                                    { value: "balanced", label: "Balanced" },
                                                    { value: "aggressive", label: "Aggressive" },
                                                ]}
                                            />
                                        </Row>

                                        <Row
                                            title="Fraud alert threshold"
                                            description={`Only alert me when a transaction's risk score is ${ai.fraudThreshold} or higher out of 100. Lower numbers mean more alerts.`}
                                        >
                                            <div className="flex w-full items-center gap-3 sm:w-60">
                                                <input
                                                    type="range"
                                                    min={10}
                                                    max={95}
                                                    step={5}
                                                    value={ai.fraudThreshold}
                                                    onChange={(e) =>
                                                        set("ai", "fraudThreshold")(Number(e.target.value))
                                                    }
                                                    aria-label="Fraud alert threshold"
                                                    className="h-2 flex-1 cursor-pointer accent-indigo-600"
                                                />
                                                <span className="w-8 text-right text-sm font-semibold text-gray-900">
                                                    {ai.fraudThreshold}
                                                </span>
                                            </div>
                                        </Row>

                                        <Row
                                            title="Expense forecast period"
                                            description="How far ahead to predict your spending."
                                        >
                                            <Segmented
                                                label="Expense forecast period"
                                                value={ai.forecastMonths}
                                                onChange={set("ai", "forecastMonths")}
                                                options={[
                                                    { value: 1, label: "1 month" },
                                                    { value: 3, label: "3 months" },
                                                    { value: 6, label: "6 months" },
                                                ]}
                                            />
                                        </Row>

                                        <Row
                                            title="Refresh insights automatically"
                                            description="Generate new recommendations when your portfolio changes, so you don't have to press Refresh."
                                        >
                                            <Toggle
                                                label="Refresh insights automatically"
                                                checked={ai.autoRecommendations}
                                                onChange={set("ai", "autoRecommendations")}
                                            />
                                        </Row>
                                    </div>
                                )}

                                {tab === "display" && (
                                    <div className="divide-y divide-gray-100">
                                        <Row
                                            title="Default chart range"
                                            description="The time range the portfolio chart opens with."
                                        >
                                            <Segmented
                                                label="Default chart range"
                                                value={display.defaultRange}
                                                onChange={set("display", "defaultRange")}
                                                options={["1W", "1M", "3M", "1Y"].map((r) => ({
                                                    value: r,
                                                    label: r,
                                                }))}
                                            />
                                        </Row>

                                        <Row
                                            title="Hide balances"
                                            description="Mask amounts on the dashboard, handy when someone else can see your screen."
                                        >
                                            <Toggle
                                                label="Hide balances"
                                                checked={display.hideBalances}
                                                onChange={set("display", "hideBalances")}
                                            />
                                        </Row>
                                    </div>
                                )}
                            </Card>

                            {/* Save bar */}
                            {(dirty || message) && (
                                <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
                                    <p
                                        role={message?.type === "error" ? "alert" : "status"}
                                        className={`text-sm ${
                                            message?.type === "error"
                                                ? "text-red-700"
                                                : message
                                                ? "text-green-700"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        {message ? message.text : "You have unsaved changes."}
                                    </p>

                                    {dirty && (
                                        <div className="flex shrink-0 gap-3">
                                            <button
                                                onClick={handleDiscard}
                                                disabled={saving}
                                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {saving ? "Saving…" : "Save settings"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default SettingsPage;