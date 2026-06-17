const Textarea = ({
    id,
    placeholder,
    className = "",
    rows = 3,
    maxLength,
    value,
    onChange,
    ...props
}) => {
    return (
        <textarea
            id={id}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--accent-2) focus:border-transparent transition-all resize-none ${className}`}
            {...props}
        />
    );
};

export default Textarea;
