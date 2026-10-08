import { useState } from "react";
import { api, clearToken } from "../../lib/api";
import { FormMessage } from "../ui/Field";

const CONFIRM_WORD = "DELETE";

const DeleteAccount = () => {
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);
        try {
            await api.del("/users/me");
            clearToken();
            window.location.assign("/login");
        } catch (err) {
            setError(err.message);
            setDeleting(false);
        }
    };

    const cancel = () => {
        setOpen(false);
        setTyped("");
        setError(null);
    };

    return (
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Delete account</h2>
            <p className="mt-1 text-sm text-gray-500">
                This permanently deletes your portfolios, holdings, transactions, reports and every
                other record tied to your account. You can't undo it.
            </p>

            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="mt-4 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Delete my account
                </button>
            ) : (
                <div className="mt-4 space-y-3">
                    <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700">
                        Type {CONFIRM_WORD} to confirm
                    </label>
                    <input
                        id="confirm-delete"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        className="w-full max-w-xs rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        autoComplete="off"
                    />

                    {error && <FormMessage type="error">{error}</FormMessage>}

                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={typed !== CONFIRM_WORD || deleting}
                            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                        >
                            {deleting ? "Deleting…" : "Permanently delete account"}
                        </button>
                        <button
                            onClick={cancel}
                            disabled={deleting}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default DeleteAccount;