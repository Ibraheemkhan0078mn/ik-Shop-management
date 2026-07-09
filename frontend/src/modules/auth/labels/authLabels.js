export const authLabels = {
  en: {
    // Page titles
    login: "Login",
    signup: "Sign Up",
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    
    // Form labels
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    password: "Password",
    confirmPassword: "Confirm Password",
    role: "Role",
    
    // Buttons
    signIn: "Sign In",
    signUp: "Sign Up",
    switchToLogin: "Already have an account? Sign In",
    switchToSignup: "Don't have an account? Sign Up",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    
    // Messages
    passwordsDoNotMatch: "Passwords do not match",
    loginSuccess: "Login successful",
    signupSuccess: "Account created successfully",
    loginFailed: "Login failed",
    signupFailed: "Account creation failed",
    somethingWentWrong: "Something went wrong",
    
    // Features
    advancedAnalytics: "Advanced Analytics & Reports",
    secureAccess: "Secure & Role-Based Access",
    fastPerformance: "Lightning Fast Performance",
  },
  ur: {
    // Page titles
    login: "لاگ ان",
    signup: "سائن اپ",
    welcomeBack: "خوش آمدید",
    createAccount: "اکاؤنٹ بنائیں",
    
    // Form labels
    name: "پورا نام",
    email: "ای میل ایڈریس",
    phone: "فون نمبر",
    password: "پاس ورڈ",
    confirmPassword: "پاس ورڈ کی تصدیق کریں",
    role: "کردار",
    
    // Buttons
    signIn: "سائن ان",
    signUp: "سائن اپ",
    switchToLogin: "پہلے سے اکاؤنٹ ہے؟ سائن ان کریں",
    switchToSignup: "اکاؤنٹ نہیں ہے؟ سائن اپ کریں",
    rememberMe: "مجھے یاد رکھیں",
    forgotPassword: "پاس ورڈ بھول گئے؟",
    
    // Messages
    passwordsDoNotMatch: "پاس ورڈز مماثل نہیں ہیں",
    loginSuccess: "لاگ ان کامیاب",
    signupSuccess: "اکاؤنٹ کامیابی سے بنایا گیا",
    loginFailed: "لاگ ان ناکام",
    signupFailed: "اکاؤنٹ بنانے میں ناکامی",
    somethingWentWrong: "کچھ غلط ہو گیا",
    
    // Features
    advancedAnalytics: "ایڈوانسڈ اینالیٹکس اور رپورٹس",
    secureAccess: "محفوظ اور رول بیسڈ رسائی",
    fastPerformance: "بجلی سے تیز کارکردگی",
  },
  ur_en: {
    // Page titles
    login: "لاگ ان / Login",
    signup: "سائن اپ / Sign Up",
    welcomeBack: "خوش آمدید / Welcome Back",
    createAccount: "اکاؤنٹ بنائیں / Create Account",
    
    // Form labels
    name: "پورا نام / Full Name",
    email: "ای میل ایڈریس / Email Address",
    phone: "فون نمبر / Phone Number",
    password: "پاس ورڈ / Password",
    confirmPassword: "پاس ورڈ کی تصدیق کریں / Confirm Password",
    role: "کردار / Role",
    
    // Buttons
    signIn: "سائن ان / Sign In",
    signUp: "سائن اپ / Sign Up",
    switchToLogin: "پہلے سے اکاؤنٹ ہے؟ سائن ان کریں / Already have an account? Sign In",
    switchToSignup: "اکاؤنٹ نہیں ہے؟ سائن اپ کریں / Don't have an account? Sign Up",
    rememberMe: "مجھے یاد رکھیں / Remember me",
    forgotPassword: "پاس ورڈ بھول گئے؟ / Forgot password?",
    
    // Messages
    passwordsDoNotMatch: "پاس ورڈز مماثل نہیں ہیں / Passwords do not match",
    loginSuccess: "لاگ ان کامیاب / Login successful",
    signupSuccess: "اکاؤنٹ کامیابی سے بنایا گیا / Account created successfully",
    loginFailed: "لاگ ان ناکام / Login failed",
    signupFailed: "اکاؤنٹ بنانے میں ناکامی / Account creation failed",
    somethingWentWrong: "کچھ غلط ہو گیا / Something went wrong",
    
    // Features
    advancedAnalytics: "ایڈوانسڈ اینالیٹکس اور رپورٹس / Advanced Analytics & Reports",
    secureAccess: "محفوظ اور رول بیسڈ رسائی / Secure & Role-Based Access",
    fastPerformance: "بجلی سے تیز کارکردگی / Lightning Fast Performance",
  },
};

export const getAuthLabels = (language) => {
  const langKey = language === "ur_en" ? "ur_en" : language === "ur" ? "ur" : "en";
  return authLabels[langKey] || authLabels.en;
};
