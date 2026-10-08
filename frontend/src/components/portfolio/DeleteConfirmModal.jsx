import { AlertTriangle, X } from "lucide-react";

const DeleteConfirmModal = ({
    open,
    title = "Delete",
    message = "Are you sure you want to delete this?",
    onClose,
    onConfirm,
    loading,
}) => {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-900">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <AlertTriangle size={21} />
                        </div>

                        <div>
                            <p className="text-sm leading-6 text-slate-600">
                                {message}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;