import { useState } from "react";
import { FileBarChart } from "lucide-react";

import { PERIODS, REPORT_TYPES, generateReport, periodToRange } from "../../lib/reports";
import { Card, CardHeader } from "../ui/primitives";
import { Field, FormMessage } from "../ui/Field";

const GenerateReportCard = ({ onGenerated }) => {
    const [type, setType] = useState(REPORT_TYPES[0].value);
    const [period, setPeriod] = useState("this_month");
    const [custom, setCustom] = useState({ from: "", to: "" });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const range = period === "custom" ? custom : periodToRange(period);

    const customError =
        period === "custom" && custom.from && custom.to && custom.from > custom.to
            ? "The start date must be on or before the end date."
            : null;

    const canSubmit =
        !submitting && range.from && range.to && !customError;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setMessage(null);
        try {
            await generateReport({ type, ...range });
            setMessage({
                type: "success",
                text: "Report requested. It will appear in the list below and unlock for download when it's ready.",
            });
            onGenerated?.();
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader title="Generate a report" subtitle="Pick a report type and the period it should cover." />

            <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset>
                    <legend className="mb-2 text-sm font-medium text-gray-700">Report type</legend>
                    <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                        {REPORT_TYPES.map(({ value, label, description, icon: Icon }) => {
                            const selected = type === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => {
                                        setType(value);
                                        setMessage(null);
                                    }}
                                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                                        selected
                                            ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                                            : "border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    <span
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-900">{label}</span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                                            {description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
                    <div>
                        <label htmlFor="period" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Period
                        </label>
                        <select
                            id="period"
                            value={period}
                            onChange={(e) => {
                                setPeriod(e.target.value);
                                setMessage(null);
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                            {PERIODS.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {period === "custom" ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                id="from"
                                label="From"
                                type="date"
                                value={custom.from}
                                max={custom.to || undefined}
                                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                            />
                            <Field
                                id="to"
                                label="To"
                                type="date"
                                value={custom.to}
                                min={custom.from || undefined}
                                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                                error={customError}
                            />
                        </div>
                    ) : (
                        <p className="self-end pb-2.5 text-sm text-gray-500">
                            Covers {range.from} to {range.to}
                        </p>
                    )}
                </div>

                {message && <FormMessage type={message.type}>{message.text}</FormMessage>}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                        <FileBarChart size={16} />
                        {submitting ? "Requesting…" : "Generate report"}
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default GenerateReportCard;