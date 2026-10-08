import { useEffect, useState } from "react";
import { X } from "lucide-react";

const PortfolioModal = ({
    open,
    mode = "create",
    portfolio,
    onClose,
    onSubmit,
    loading,
}) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (open) {
            setName(portfolio?.name || "");
        }
    }, [open, portfolio]);

    if (!open) {
        return null;
    }

    const isEdit = mode === "edit";

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        await onSubmit({
            name: trimmedName,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            {isEdit
                                ? "Rename Portfolio"
                                : "Create Portfolio"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {isEdit
                                ? "Update your portfolio name."
                                : "Create a new investment portfolio."}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-5">
                        <label className="text-sm font-medium text-slate-700">
                            Portfolio Name
                        </label>

                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Long Term Investments"
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Saving..."
                                : isEdit
                                    ? "Save Changes"
                                    : "Create Portfolio"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PortfolioModal;