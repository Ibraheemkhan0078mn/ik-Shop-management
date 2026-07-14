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
    ...props
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef();

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selected = options.find((opt) => opt.value === value);

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
        <div ref={ref} className="relative w-full z-[9999]" {...props}>
            {/* Selected Box */}
            <div
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full px-3 py-2 border rounded-lg cursor-pointer bg-white ${className}`}
            >
                {selected ? selected.label : placeholder}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-[9999] w-full bg-white border mt-1 rounded-lg shadow-md">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border-b outline-none"
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
                                            onChange && onChange(opt.value);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className={`px-3 py-2 ${isDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-teal-100 cursor-pointer"}`}
                                        aria-disabled={isDisabled}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{opt.label}</span>
                                            {isDisabled && (
                                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
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