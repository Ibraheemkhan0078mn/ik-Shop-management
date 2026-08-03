import { ChevronDown, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

export const SelectContent = ({ children }) => <div>{children}</div>;
export const SelectItem = ({ value, children }) => (
    <div data-value={value}>{children}</div>
);

export const Select = ({
    children,
    onValueChange,
    defaultValue,
    placeholder = "Select or type...",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(defaultValue || "");
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef(null);
    const listRef = useRef(null); // Ref for the dropdown list container

    // Handle auto-scrolling when activeIndex changes
    useEffect(() => {
        if (activeIndex !== -1 && listRef.current) {
            const activeElement = listRef.current.childNodes[activeIndex];
            if (activeElement) {
                activeElement.scrollIntoView({
                    block: "nearest", // Only scrolls if the item is out of view
                    behavior: "smooth",
                });
            }
        }
    }, [activeIndex]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) setActiveIndex(-1);
    }, [isOpen, inputValue]);

    const options = useMemo(() => {
        if (!children || !children.props.children) return [];
        const kids = children.props.children;
        return Array.isArray(kids) ? kids : [kids];
    }, [children]);

    const filteredOptions = useMemo(() => {
        return options.filter((child) =>
            child.props.children
                .toString()
                .toLowerCase()
                .includes(inputValue.toLowerCase()),
        );
    }, [options, inputValue]);

    const handleSelect = (value, label) => {
        setInputValue(label);
        onValueChange(value);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
            setIsOpen(true);
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0 && filteredOptions[activeIndex]) {
                    const selected = filteredOptions[activeIndex];
                    handleSelect(selected.props.value, selected.props.children);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div
            className="relative w-full"
            ref={containerRef}
            onKeyDown={handleKeyDown}
        >
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                        onValueChange(e.target.value);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full text-sm px-4 py-2 pr-10 text-left bg-(--surface) rounded-lg transition-all outline-none
                             border-2 border-(--border) focus:border-(--accent-2) focus:ring-4 focus:ring-(--accent-2)/10
                             text-(--ink) placeholder:text-(--muted)"
                />

                <div className="absolute right-2 flex items-center gap-1">
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => {
                                setInputValue("");
                                onValueChange("");
                            }}
                            className="p-1 hover:bg-(--surface-muted) rounded-full text-(--muted)"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        className={`transition-transform duration-300 text-(--muted) cursor-pointer ${isOpen && "rotate-180"}`}
                        size={18}
                        onClick={() => setIsOpen(!isOpen)}
                    />
                </div>
            </div>

            {isOpen && (
                <div
                    ref={listRef} // Attach ref to the scrollable container
                    className="absolute z-20 w-full mt-1 bg-(--surface) border border-(--border) rounded-lg shadow-xl max-h-60 overflow-auto scroll-smooth"
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((child, idx) => (
                            <div
                                key={idx}
                                onClick={() =>
                                    handleSelect(
                                        child.props.value,
                                        child.props.children,
                                    )
                                }
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors border-b border-(--border) last:border-0
                                    ${activeIndex === idx ? "bg-(--accent-2) text-white" : "hover:bg-(--surface-muted)"}
                                `}
                            >
                                {child.props.children}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-(--muted) italic bg-(--surface-muted)">
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
