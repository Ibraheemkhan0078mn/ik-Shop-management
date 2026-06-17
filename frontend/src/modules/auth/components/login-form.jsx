import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLogin } from "../services/auth.service";
import NetworkStatusSpan from "@shared/components/NetworkChecker";
import imgLogo from "@shared/assets/Chai_fi_cup.png";
export function LoginForm() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const login = useLogin();

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        await login.mutateAsync(formData);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-(--surface-muted) p-4">
            <div className="relative w-full max-w-md bg-(--surface) rounded-3xl shadow-xl border border-(--border) p-8 sm:p-10 mt-16">
                <div className="absolute border-2  border-(--border) -top-18 bg-(--surface)  left-1/2 transform -translate-x-1/2 p-2 w-30 h-30 rounded-full flex items-center justify-center shadow-lg">
                    <img src={imgLogo} className="h-full w-full pr-2" />
                </div>

                {/* Header */}
                <div className="mt-10 text-center mb-8">
                    <h1 className="text-3xl font-bold text-(--ink)">
                        Welcome Back
                    </h1>
                    <p className="text-(--muted) mt-2 text-sm">
                        Login to your account
                    </p>
                    <div className="flex mt-2">
                        <NetworkStatusSpan />
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div className="flex flex-col gap-1.5 relative">
                        <label
                            className="text-sm font-medium text-(--ink)"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            placeholder="you@example.com"
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) text-(--ink) text-sm
                focus:ring-2 focus:ring-(--accent-2) focus:outline-none focus:border-(--accent-2) placeholder-[color:var(--muted)]"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5 relative">
                        <div className="flex items-center justify-between">
                            <label
                                className="text-sm font-medium text-(--ink)"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            {/* <Link to="#" className="text-xs text-(--ink) hover:underline">
                Forgot password?
              </Link> */}
                        </div>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) text-(--ink) text-sm
                focus:ring-2 focus:ring-(--accent-2) focus:outline-none focus:border-(--accent-2) placeholder-[color:var(--muted)]"
                        />
                    </div>

                    {/* Sign in button */}
                    <button
                        type="submit"
                        className="w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl
              hover:bg-[#0b5f59] transition shadow-md"
                    >
                        Sign In
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-(--muted) text-sm">
                    Don’t have an account?{" "}
                    <Link
                        to="/signup"
                        className="text-(--ink) font-medium hover:underline"
                    >
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
}


