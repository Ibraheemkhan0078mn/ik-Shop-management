import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin, useSignup } from "../services/auth.service.js";

export default function Login() {
    const navigate = useNavigate();
    const handleLogin = useLogin();
    const handleSignup = useSignup();

    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNo: "",
        password: "",
        confirmPassword: "",
        role: "admin",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            handleLogin({ email: formData.email, password: formData.password, role: formData.role });
        } else {
            handleSignup(formData);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-muted)" }}>
            <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex mb-6">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 font-medium ${isLogin ? "border-b-2" : ""}`}
                        style={{ borderColor: isLogin ? "var(--accent-2)" : "transparent", color: isLogin ? "var(--accent-2)" : "var(--muted)" }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 font-medium ${!isLogin ? "border-b-2" : ""}`}
                        style={{ borderColor: !isLogin ? "var(--accent-2)" : "transparent", color: !isLogin ? "var(--accent-2)" : "var(--muted)" }}
                    >
                        Register
                    </button>
                </div>

                <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--ink)" }}>
                    {isLogin ? "Login" : "Admin Registration"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                                Name
                            </label>
                            <input
                                type="text"
                                required={!isLogin}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phoneNo}
                                onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required={!isLogin}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                        >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 rounded-lg font-medium transition"
                        style={{ background: "var(--accent-2)", color: "white" }}
                    >
                        {isLogin ? "Login" : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
}
