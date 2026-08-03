import React, { forwardRef } from "react";

const Input = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    id,
    className = "",
    ...props
}) => {
    const inputId = id || name;

    return (
        <div className="space-y-1">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-bold text-(--ink) ml-1"
                >
                    {label}
                    {required && (
                        <span className="text-(--accent) ml-1">*</span>
                    )}
                </label>
            )}

            <input
                id={inputId}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={`w-full p-2 text-sm rounded-lg border-2 border-(--border) focus:ring-4 focus:ring-(--accent-2)/10 focus:border-(--accent-2) outline-none transition-all ${className}`}
                {...props}
            />
        </div>
    );
};

export default Input;
