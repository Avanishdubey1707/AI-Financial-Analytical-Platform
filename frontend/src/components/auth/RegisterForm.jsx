import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";

const RegisterForm = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!form.name || !form.email || !form.password) {
            setError("Name, email and password are required");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);

            await registerUser(form);

            navigate("/login");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white p-8 shadow-xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Create Account
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Create your account to get started
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Full Name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            autoComplete="name"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                        />
                    </div>

                    {/* Register */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                {/* Login */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-black hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;