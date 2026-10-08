import { AlertCircle } from "lucide-react";

export const Card = ({ className = "", children }) => (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
        {children}
    </section>
);

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="mb-5 flex items-start justify-between gap-3">
        <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
    </div>
);

export const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />
);

export const InlineError = ({ error, onRetry }) => (
    <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
            <p className="font-medium">Couldn't load this section</p>
            <p className="mt-0.5 text-red-600/80">{error?.message ?? "Something went wrong."}</p>
        </div>
        {onRetry && (
            <button
                onClick={onRetry}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100"
            >
                Try again
            </button>
        )}
    </div>
);

export const EmptyState = ({ title, message }) => (
    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {message && <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">{message}</p>}
    </div>
);