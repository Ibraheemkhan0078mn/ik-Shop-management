import React, { useState, useEffect } from "react";
import { useLogin, useSignup } from "../services/auth.service.js";
import { useCheckAdminRegistrationQuery, useCheckConnectionStatusQuery } from "../services/authApi.js";
import { Eye, EyeOff, BarChart3, Shield, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getAuthLabels } from "../labels/authLabels.js";
import InternetStatusIndicator from "../../../shared/components/InternetStatusIndicator.jsx";

const LANGUAGE_KEY = "appLanguage";

const getFeatureList = (labels) => [
  { icon: BarChart3, label: labels.advancedAnalytics },
  { icon: Shield,   label: labels.secureAccess },
  { icon: Zap,      label: labels.fastPerformance },
];

const EMPTY_FORM = {
  name: "", email: "",
  password: "", role: "admin",
};

export default function AuthPage() {
  const loginUser  = useLogin();
  const signupUser = useSignup();
  const { data: adminCheck } = useCheckAdminRegistrationQuery();
  const { data: connectionStatus, refetch: refetchConnection } = useCheckConnectionStatusQuery(undefined, {
    pollingInterval: 5000, // Check connection every 5 seconds
    refetchOnFocus: true,
  });

  // Load language from localStorage
  const [language] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) || "en";
    } catch {
      return "en";
    }
  });
  
  const labels = getAuthLabels(language);
  const featureList = getFeatureList(labels);

  const [isLoginMode,      setIsLoginMode]      = useState(true);
  const [showPassword,     setShowPassword]      = useState(false);
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [formData,         setFormData]          = useState(EMPTY_FORM);
  const emailInputRef       = React.useRef(null);
  const nameInputRef       = React.useRef(null);


  // Separate useEffect for auto-focus to avoid conflicts
  useEffect(() => {
    // Auto-focus on mount and mode change - email for login, name for signup
    setTimeout(() => {
      if (isLoginMode) {
        emailInputRef.current?.focus();
      } else {
        nameInputRef.current?.focus();
      }
    }, 150);
  }, [isLoginMode]);

  const updateField = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const toggleAuthMode = () => {
    // Only allow switching to registration if admin registration is allowed
    if (!isLoginMode && !adminCheck?.allowed) {
      toast.error("Admin registration is not allowed. An admin account already exists.");
      return;
    }
    
    const newMode = !isLoginMode;
    setIsLoginMode(newMode);
    setFormData(EMPTY_FORM);
    setShowPassword(false);
    // Auto-focus after mode switch
    setTimeout(() => {
      if (!newMode) {
        // Switching to signup - focus name
        nameInputRef.current?.focus();
      } else {
        // Switching to login - focus email
        emailInputRef.current?.focus();
      }
    }, 100);
  };

  const submitAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        const response = await loginUser({ email: formData.email, password: formData.password, role: formData.role });
        console.log(response, "The data");
        
        // Show enhanced login success message based on login source
        if (response?.message?.includes("from online database")) {
          if (response?.role === 'admin') {
            toast.success("Login successful! Connected to online database - All data synchronized.");
          } else {
            toast.success("Login successful! Online authentication - Local data optimized for staff access.");
          }
        } else if (response?.message?.includes("from local database")) {
          if (response?.role === 'admin') {
            toast.success("Login successful! Local database access - Admin privileges available.");
          } else {
            toast.success("Login successful! Local authentication - Staff mode active.");
          }
        } else if (response?.message?.includes("offline mode")) {
          toast.success("Login successful! Offline mode - Local data only.");
        } else {
          // Fallback message
          const baseMessage = "Login successful!";
          if (response?.role === 'admin') {
            toast.success(`${baseMessage} Welcome Admin - All data available.`);
          } else if (response?.role && response.role !== 'admin') {
            toast.success(`${baseMessage} Staff mode - Local data optimized.`);
          } else {
            toast.success(baseMessage);
          }
        }
        
        // Refresh connection status after login
        refetchConnection();
      } else {
        // Registration - show connection status in success message
        const response = await signupUser(formData);
        if (response?.savedToOnline) {
          toast.success("Admin registered successfully! Saved to both local and online database.");
        } else if (response?.onlineConnected === false) {
          toast.success("Admin registered successfully! Saved to local database. Will sync to online when connected.");
        } else {
          toast.success("Admin registered successfully!");
        }
        // Refresh connection status after registration
        refetchConnection();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.message ?? labels.somethingWentWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex lg:w-[45%] min-h-[300px] lg:min-h-screen flex-col justify-between p-8 lg:p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #14b8a6 100%)" }}
      >
        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)" }}
        />

        {/* accent glow */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", opacity: 1 }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <span className="font-bold text-white text-base leading-none">S</span>
          </div>
          <span className="font-display text-lg font-semibold text-white tracking-tight">Shop Management</span>
        </div>

        {/* Hero text + features */}
        <div className="relative flex-1 flex flex-col justify-center py-12 lg:py-0">
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {isLoginMode ? "Welcome back" : "Get started"}
          </div>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-5">
            {isLoginMode
              ? <>Run your shop<br /><span style={{ color: "rgba(255,255,255,0.9)" }}>with clarity.</span></>
              : <>Your business,<br /><span style={{ color: "rgba(255,255,255,0.9)" }}>fully managed.</span></>}
          </h1>

          <p className="text-white/60 text-sm max-w-xs leading-relaxed mb-10">
            {isLoginMode
              ? "Sign in to your dashboard and keep everything in order."
              : "Create your account and take control of every moving part."}
          </p>

          <ul className="space-y-4">
            {featureList.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <Icon size={15} color="white" />
                </span>
                <span className="text-white/80 text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom trust strip */}
        <div
          className="relative flex items-center gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
        >
          <div className="flex -space-x-2">
            {["AK", "MR", "JD"].map(initials => (
              <div
                key={initials}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ring-2"
                style={{ background: "rgba(255,255,255,0.25)", ringColor: "#0f766e" }}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-white/50 text-xs">Trusted by 500+ shop owners</p>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div
        className="w-full lg:w-[55%] h-[100vh] flex items-center justify-center p-6 lg:p-16 app-enter"
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
            <h2 id="auth-heading" className="font-display text-3xl font-bold mb-2" style={{ color: "var(--ink)" }}>
              {isLoginMode ? labels.signIn : labels.signUp}
            </h2>
            <p id="auth-subheading" className="text-sm" style={{ color: "var(--muted)" }}>
              {isLoginMode ? "Enter your credentials to continue" : "Fill in your details to get started"}
            </p>
            
            {/* Internet Connection Status */}
            <div className="mt-4">
              <InternetStatusIndicator connectionStatus={connectionStatus} size="md" showLabel={true} />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submitAuth} className="space-y-4">

            {!isLoginMode && (
              <FormField label={labels.name}>
                <input
                  ref={nameInputRef}
                  id="auth-name-input"
                  className="input-search"
                  type="text" required placeholder="John Doe"
                  value={formData.name} onChange={updateField("name")}
                />
              </FormField>
            )}

            <FormField label={labels.email}>
              <input
                ref={emailInputRef}
                id="auth-email-input"
                className="input-search"
                type="email" required placeholder="john@example.com"
                value={formData.email} onChange={updateField("email")}
              />
            </FormField>


            <FormField label={labels.password}>
              <div className="relative">
                <input
                  id="auth-password-input"
                  className="input-search pr-11"
                  type={showPassword ? "text" : "password"}
                  required placeholder="••••••••"
                  value={formData.password} onChange={updateField("password")}
                />
                <button
                  id="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {isLoginMode && (
                <div className="mt-2 text-xs">
                  {connectionStatus?.connected ? (
                    <p className="text-green-700">
                      ✓ Priority: Online database login, fallback to local database
                    </p>
                  ) : (
                    <p className="text-orange-700">
                      ⚠ Local database login only (will check online when connected)
                    </p>
                  )}
                </div>
              )}
            </FormField>


            <FormField label={labels.role}>
              <div className="input-search flex items-center justify-between bg-(--surface-muted)">
                <span className="text-sm font-medium">Admin</span>
                {!isLoginMode && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    (Default role)
                  </p>
                )}
              </div>
              {!isLoginMode && (
                <div className="space-y-1 mt-1">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Note: Registration is restricted to admin role only.
                  </p>
                  {connectionStatus?.connected ? (
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Will save to both local and online database
                    </p>
                  ) : (
                    <p className="text-xs text-orange-700 font-medium">
                      ⚠ Will save to local database only (will sync when online)
                    </p>
                  )}
                </div>
              )}
            </FormField>


            <button
              id="auth-submit-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm text-white transition-all duration-200 mt-2 disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, var(--accent-2), #0b5f59)" }}
            >
              {isSubmitting ? "Please wait…" : isLoginMode ? labels.signIn : labels.signUp}
              {!isSubmitting && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            {isLoginMode ? labels.switchToSignup.split("?")[0] + "? " : labels.switchToLogin.split("?")[0] + "? "}
            {adminCheck?.allowed ? (
              <button
                id="auth-toggle-button"
                type="button"
                onClick={toggleAuthMode}
                className="font-semibold hover:underline text-primary"
              >
                {isLoginMode ? labels.signUp : labels.signIn}
              </button>
            ) : (
              <span className="text-muted">Registration is disabled (admin already exists)</span>
            )}
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