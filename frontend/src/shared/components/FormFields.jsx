import { useState, useRef, useEffect } from "react";

/* =========================
   FormField Wrapper
========================= */
export const FormField = ({ label, error, children }) => {
    return (
        <div className="w-full flex flex-col gap-1">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {children}

            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </div>
    );
};

/* =========================
   Input
========================= */
export const Input = ({ className = "", ...props }) => {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2 border rounded-lg outline-none 
      focus:ring-2 focus:ring-teal-500 ${className}`}
        />
    );
};

/* =========================
   Textarea
========================= */
export const Textarea = ({ className = "", ...props }) => {
    return (
        <textarea
            {...props}
            className={`w-full px-3 py-2 border rounded-lg outline-none 
      focus:ring-2 focus:ring-teal-500 resize-none ${className}`}
        />
    );
};

/* =========================
   Searchable Select
========================= */
export const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    isMulti = false,
    ...props
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef();

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedValues = isMulti && Array.isArray(value) ? value : [];
    const selected = options.find((opt) => opt.value === value);
    const selectedOptions = isMulti
        ? options.filter((opt) => selectedValues.includes(opt.value))
        : [];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative w-full z-9999" {...props}>
            {/* Selected Box */}
            <div
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full px-3 py-2 border rounded-lg cursor-pointer ${className}`}
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: selected || selectedOptions.length > 0 ? "var(--ink)" : "var(--muted)",
                }}
            >
                {isMulti
                    ? selectedOptions.length > 0
                        ? selectedOptions.map((opt) => opt.label).join(", ")
                        : placeholder
                    : selected?.label || placeholder}
            </div>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-9999 w-full border mt-1 rounded-lg shadow-md overflow-hidden"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
                >
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border-b outline-none placeholder:text-(--muted)"
                        style={{
                            background: "var(--surface-muted)",
                            borderColor: "var(--border)",
                            color: "var(--ink)",
                        }}
                    />

                    {/* Options */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isDisabled = Boolean(opt.disabled);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            if (isMulti) {
                                                const nextValues = selectedValues.includes(opt.value)
                                                    ? selectedValues.filter((value) => value !== opt.value)
                                                    : [...selectedValues, opt.value];
                                                onChange && onChange(nextValues);
                                            } else {
                                                onChange && onChange(opt.value);
                                                setOpen(false);
                                            }
                                            setSearch("");
                                        }}
                                        className={`px-3 py-2 ${isDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-(--surface-muted) cursor-pointer"}`}
                                        aria-disabled={isDisabled}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{opt.label}</span>
                                            {isDisabled && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-(--surface-muted) text-(--muted)">
                                                    Non Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-2 text-sm text-gray-500">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* =========================
   Optional: Default Export
========================= */
export default {
    FormField,
    Input,
    Textarea,
    SearchableSelect,
};