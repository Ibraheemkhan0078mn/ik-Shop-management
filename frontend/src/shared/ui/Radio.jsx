export const RadioGroup = ({
    label,
    children,
    required = false,
    row = false,
}) => {
    return (
        <div className="space-y-2 my-2">
            {label && (
                <label className="text-sm font-bold text-(--ink) ml-1">
                    {label}
                    {required && (
                        <span className="text-(--accent) ml-1">*</span>
                    )}
                </label>
            )}
            <div
                className={`flex ${row ? " items-center gap-4" : "flex-col space-y-2"} ml-1`}
            >
                {children}
            </div>
        </div>
    );
};

export const RadioItem = ({
    label,
    name,
    value,
    checked,
    onChange,
    id,
    ...props
}) => {
    const radioId = id || `${name}-${value}`;

    return (
        <label
            htmlFor={radioId}
            className="flex items-center group cursor-pointer w-fit"
        >
            <div className="relative flex items-center justify-center">
                <input
                    type="radio"
                    id={radioId}
                    name={name}
                    value={value}
                    checked={checked}
                    onChange={onChange}
                    className="
                        peer appearance-none w-5 h-5 
                        border-2 border-(--border) rounded-full bg-(--surface)
                        checked:border-(--accent-2) checked:ring-4 checked:ring-(--accent-2)/10
                        focus:outline-none focus:ring-4 focus:ring-(--accent-2)/10 focus:border-(--accent-2)
                        transition-all cursor-pointer
                    "
                    {...props}
                />
                {/* Inner dot that appears when checked */}
                <div
                    className="
                    absolute w-2.5 h-2.5 rounded-full bg-(--accent-2) 
                    scale-0 peer-checked:scale-100 transition-transform duration-200
                    pointer-events-none
                "
                />
            </div>
            {label && (
                <span className="ml-3 text-(--ink) font-medium group-hover:text-(--ink) transition-colors">
                    {label}
                </span>
            )}
        </label>
    );
};
