import { useState } from "react";
import { api } from "../../lib/api";
import { Card, CardHeader } from "../ui/primitives";
import { Field, FormMessage } from "../ui/Field";

const EMPTY = { current: "", next: "", confirm: "" };

const PasswordForm = () => {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const update = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((er) => ({ ...er, [field]: undefined }));
        setMessage(null);
    };

    const validate = () => {
        const next = {};
        if (!form.current) next.current = "Enter your current password.";
        if (form.next.length < 8) next.next = "Use at least 8 characters.";
        else if (form.next === form.current) next.next = "Choose a password you haven't used here before.";
        if (form.confirm !== form.next) next.confirm = "Passwords don't match.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        setMessage(null);
        try {
            await api.put("/users/me/password", {
                current_password: form.current,
                new_password: form.next,
            });
            setForm(EMPTY);
            setMessage({ type: "success", text: "Password changed." });
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader title="Password" subtitle="Change the password you use to sign in." />

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Field
                    id="current-password"
                    label="Current password"
                    type="password"
                    value={form.current}
                    onChange={update("current")}
                    error={errors.current}
                    autoComplete="current-password"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        id="new-password"
                        label="New password"
                        type="password"
                        value={form.next}
                        onChange={update("next")}
                        error={errors.next}
                        hint="At least 8 characters."
                        autoComplete="new-password"
                    />
                    <Field
                        id="confirm-password"
                        label="Confirm new password"
                        type="password"
                        value={form.confirm}
                        onChange={update("confirm")}
                        error={errors.confirm}
                        autoComplete="new-password"
                    />
                </div>

                {message && <FormMessage type={message.type}>{message.text}</FormMessage>}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || !form.current || !form.next || !form.confirm}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                        {saving ? "Updating…" : "Update password"}
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default PasswordForm;