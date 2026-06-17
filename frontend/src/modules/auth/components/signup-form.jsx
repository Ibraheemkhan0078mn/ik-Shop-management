import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSignup } from "../services/auth.service";
import NetworkChecker from "@shared/components/NetworkChecker";
import imgLogo from "@shared/assets/Chai_fi_cup.png";
export function SignupForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "admin",
    });
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { mutateAsync: signUp } = useSignup();

    function handleChange(e) {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);

        if (updatedFormData.confirmPassword.length > 0) {
            setError(
                updatedFormData.password !== updatedFormData.confirmPassword
                    ? "Password must match"
                    : null,
            );
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
        };

        await signUp(payload);

    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--app-bg)] p-5">
            <div className="relative w-full max-w-2xl mt-16 bg-(--surface) rounded-2xl shadow-xl border border-(--border) p-5 sm:p-10">
                {/* Floating Logo */}
                <div className="absolute border-2  border-(--border) -top-18 bg-(--surface)  left-1/2 transform -translate-x-1/2 p-2 w-30 h-30 rounded-full flex items-center justify-center shadow-lg">
                    <img src={imgLogo} className="h-full w-full pr-2" />
                </div>

                {/* Header */}
                <div className="mt-10 text-center mb-6 space-y-2">
                    <h1 className="text-3xl font-bold text-(--ink)">
                        Welcome to <span className="text-(--accent)">Chai</span>{" "}
                        Fi System
                    </h1>
                    <p className="text-(--muted) mt-2 text-sm">
                        Register your account
                    </p>
                    {/* <p className="text-(--accent) text-sm sm:text-base font-medium flex items-center justify-center gap-1">
                        <AlertTriangle />  Internet is required for signup
                    </p> */}
                    <div className="flex">
                        <NetworkChecker />
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            className="text-sm font-medium text-(--ink)"
                            htmlFor="name"
                        >
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            placeholder="John Doe"
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) text-(--ink) text-sm
          focus:ring-2 focus:ring-(--accent-2)/20 focus:outline-none focus:border-(--accent-2) placeholder:text-(--muted)"
                        />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            className="text-sm font-medium text-(--ink)"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            placeholder="you@example.com"
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) text-(--ink) text-sm
          focus:ring-2 focus:ring-(--accent-2)/20 focus:outline-none focus:border-(--accent-2) placeholder:text-(--muted)"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            className="text-sm font-medium text-(--ink)"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) text-(--ink) text-sm
          focus:ring-2 focus:ring-(--accent-2)/20 focus:outline-none focus:border-(--accent-2) placeholder:text-(--muted)"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            className="text-sm font-medium text-(--ink)"
                            htmlFor="confirmPassword"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) text-(--ink) text-sm
          focus:ring-2 focus:ring-(--accent-2)/20 focus:outline-none focus:border-(--accent-2) placeholder:text-(--muted)"
                        />
                    </div>

                    {/* Role */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--ink)"
                            htmlFor="role"
                        >
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="px-4 py-3 rounded-xl border border-(--border) bg-(--surface) shadow-sm text-sm
          focus:ring-2 focus:ring-(--accent-2)/20 focus:outline-none focus:border-(--accent-2)"
                        >
                            <option value="admin">Admin</option>
                            {/* <option value="staff">Staff</option>
                            <option value="manager">Manager</option> */}
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-(--accent) text-sm sm:col-span-2">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="col-span-1 sm:col-span-2 w-full py-3 bg-(--accent-2) text-white text-sm font-semibold rounded-xl
        hover:bg-[#0b5f59] transition shadow-md"
                    >
                        Sign Up
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-(--muted) text-sm sm:col-span-2">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-(--ink) font-medium hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}


