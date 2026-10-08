import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, CardHeader } from "../ui/primitives";
import { Field, FormMessage } from "../ui/Field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileForm = ({ user, onSaved }) => {
    const initial = { name: user.name ?? "", email: user.email ?? "" };

    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: "success" | "error", text }

    // Keep the form in sync when the profile is refetched
    useEffect(() => {
        setForm({ name: user.name ?? "", email: user.email ?? "" });
    }, [user.name, user.email]);

    const dirty =
        form.name.trim() !== (user.name ?? "") || form.email.trim() !== (user.email ?? "");

    const update = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((er) => ({ ...er, [field]: undefined }));
        setMessage(null);
    };

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Enter your name.";
        if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        setMessage(null);
        try {
            await api.put("/users/me", { name: form.name.trim(), email: form.email.trim() });
            setMessage({ type: "success", text: "Profile updated." });
            onSaved?.();
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const discard = () => {
        setForm(initial);
        setErrors({});
        setMessage(null);
    };

    return (
        <Card>
            <CardHeader title="Personal details" subtitle="Your name and the email you sign in with." />

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        id="name"
                        label="Full name"
                        value={form.name}
                        onChange={update("name")}
                        error={errors.name}
                        autoComplete="name"
                    />
                    <Field
                        id="email"
                        label="Email address"
                        type="email"
                        value={form.email}
                        onChange={update("email")}
                        error={errors.email}
                        autoComplete="email"
                    />
                </div>

                {message && <FormMessage type={message.type}>{message.text}</FormMessage>}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={discard}
                        disabled={!dirty || saving}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                        Discard changes
                    </button>
                    <button
                        type="submit"
                        disabled={!dirty || saving}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default ProfileForm;