export const Field = ({ label, id, error, hint, className = "", ...inputProps }) => (
    <div className={className}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
        </label>

        <input
            id={id}
            aria-invalid={Boolean(error)}
            {...inputProps}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                error
                    ? "border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"
            }`}
        />

        {error ? (
            <p className="mt-1.5 text-xs text-red-600">{error}</p>
        ) : hint ? (
            <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
        ) : null}
    </div>
);

export const FormMessage = ({ type = "success", children }) => (
    <p
        role={type === "error" ? "alert" : "status"}
        className={`rounded-xl px-4 py-3 text-sm ${
            type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
        }`}
    >
        {children}
    </p>
);