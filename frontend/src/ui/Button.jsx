
import React from "react";


const Button = ({
    children,
    onClick,
    type = "button",
    variant = "default",
    size = "default",
    className = "",
    disabled = false,
}) => {
    const baseStyles =
        "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        default:
            "bg-(--accent-2) text-white hover:bg-[#0b5f59] focus:ring-(--accent-2) shadow-sm",
        outline:
            "border-2 border-(--border) bg-(--surface) hover:bg-(--surface-muted) text-(--ink) focus:ring-(--accent-2)/20",
        ghost: "hover:bg-(--surface-muted) text-(--ink)",
    };

    const sizes = {
        default: "max-h-11 h-11 px-4 py-3",
        icon: "h-11 w-10",
        md: "h-8 px-[1.5px] text-md",
        sm: "h-8 px-1 text-sm",
        lg: "h-12 px-6 text-lg",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
