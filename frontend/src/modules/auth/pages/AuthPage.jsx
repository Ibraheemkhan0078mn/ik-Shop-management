// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useLogin, useSignup } from "../services/auth.service.js";
import { Eye, EyeOff, BarChart3, Shield, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const SAVED_CREDS_KEY = "savedCredentials";

const FEATURE_LIST = [
  { icon: BarChart3, label: "Advanced Analytics & Reports" },
  { icon: Shield,   label: "Secure & Role-Based Access" },
  { icon: Zap,      label: "Lightning Fast Performance" },
];

const EMPTY_FORM = {
  name: "", email: "", phoneNo: "",
  password: "", confirmPassword: "", role: "admin",
};

export default function AuthPage() {
  const loginUser  = useLogin();
  const signupUser = useSignup();

  const [isLoginMode,      setIsLoginMode]      = useState(true);
  const [showPassword,     setShowPassword]      = useState(false);
  const [rememberMe,       setRememberMe]        = useState(false);
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [formData,         setFormData]          = useState(EMPTY_FORM);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_CREDS_KEY);
      if (!raw) return;
      const { email, password, rememberMe: saved } = JSON.parse(raw);
      if (saved) {
        setFormData(prev => ({ ...prev, email, password }));
        setRememberMe(true);
      }
    } catch {
      localStorage.removeItem(SAVED_CREDS_KEY);
    }
  }, []);

  const updateField = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const toggleAuthMode = () => {
    setIsLoginMode(prev => !prev);
    setFormData(EMPTY_FORM);
    setShowPassword(false);
  };

  const submitAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        rememberMe
          ? localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify({ email: formData.email, password: formData.password, rememberMe: true }))
          : localStorage.removeItem(SAVED_CREDS_KEY);
        await loginUser({ email: formData.email, password: formData.password, role: formData.role });
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        await signupUser(formData);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div
        className="lg:w-[45%] min-h-[300px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f1923 0%, #0f2d29 60%, #0b3d35 100%)" }}
      >
        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)" }}
        />

        {/* accent glow */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,118,110,0.18) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(15,118,110,0.35)", border: "1px solid rgba(15,118,110,0.5)" }}
          >
            <span className="font-bold text-white text-base leading-none">S</span>
          </div>
          <span className="font-display text-lg font-semibold text-white/90 tracking-tight">Shop Management</span>
        </div>

        {/* Hero text + features */}
        <div className="relative flex-1 flex flex-col justify-center py-12 lg:py-0">
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--accent-2)" }}
          >
            {isLoginMode ? "Welcome back" : "Get started"}
          </div>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-5">
            {isLoginMode
              ? <>Run your shop<br /><span style={{ color: "var(--accent-2)" }}>with clarity.</span></>
              : <>Your business,<br /><span style={{ color: "var(--accent-2)" }}>fully managed.</span></>}
          </h1>

          <p className="text-white/50 text-sm max-w-xs leading-relaxed mb-10">
            {isLoginMode
              ? "Sign in to your dashboard and keep everything in order."
              : "Create your account and take control of every moving part."}
          </p>

          <ul className="space-y-4">
            {FEATURE_LIST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(15,118,110,0.2)", border: "1px solid rgba(15,118,110,0.3)" }}
                >
                  <Icon size={15} color="var(--accent-2)" />
                </span>
                <span className="text-white/70 text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom trust strip */}
        <div
          className="relative flex items-center gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex -space-x-2">
            {["AK", "MR", "JD"].map(initials => (
              <div
                key={initials}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ring-2"
                style={{ background: "rgba(15,118,110,0.4)", ringColor: "#0f1923" }}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs">Trusted by 500+ shop owners</p>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div
        className="lg:w-[55%] flex items-center justify-center p-6 lg:p-16 app-enter"
        style={{ background: "var(--surface)" }}
      >
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-2)" }}>
              <span className="font-bold text-white text-sm leading-none">S</span>
            </div>
            <span className="font-display text-lg font-bold" style={{ color: "var(--ink)" }}>Shop Management</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold mb-2" style={{ color: "var(--ink)" }}>
              {isLoginMode ? "Sign in" : "Create account"}
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {isLoginMode ? "Enter your credentials to continue" : "Fill in your details to get started"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submitAuth} className="space-y-4">

            {!isLoginMode && (
              <FormField label="Full Name">
                <input
                  className="input-search"
                  type="text" required placeholder="John Doe"
                  value={formData.name} onChange={updateField("name")}
                />
              </FormField>
            )}

            <FormField label="Email Address">
              <input
                className="input-search"
                type="email" required placeholder="john@example.com"
                value={formData.email} onChange={updateField("email")}
              />
            </FormField>

            {!isLoginMode && (
              <FormField label="Phone Number">
                <input
                  className="input-search"
                  type="tel" placeholder="+1 234 567 890"
                  value={formData.phoneNo} onChange={updateField("phoneNo")}
                />
              </FormField>
            )}

            <FormField label="Password">
              <div className="relative">
                <input
                  className="input-search pr-11"
                  type={showPassword ? "text" : "password"}
                  required placeholder="••••••••"
                  value={formData.password} onChange={updateField("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </FormField>

            {!isLoginMode && (
              <FormField label="Confirm Password">
                <input
                  className="input-search"
                  type="password" required placeholder="••••••••"
                  value={formData.confirmPassword} onChange={updateField("confirmPassword")}
                />
              </FormField>
            )}

            <FormField label="Role">
              <select className="input-search" value={formData.role} onChange={updateField("role")}>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </FormField>

            {isLoginMode && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--accent-2)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--muted)" }}>Remember me</span>
                </label>
                <button type="button" className="text-sm font-medium hover:underline text-primary">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm text-white transition-all duration-200 mt-2 disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, var(--accent-2), #0b5f59)" }}
            >
              {isSubmitting ? "Please wait…" : isLoginMode ? "Sign in" : "Create account"}
              {!isSubmitting && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="font-semibold hover:underline text-primary"
            >
              {isLoginMode ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-5 text-center text-xs" style={{ color: "var(--muted)" }}>
            © 2025 Shop Management. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}