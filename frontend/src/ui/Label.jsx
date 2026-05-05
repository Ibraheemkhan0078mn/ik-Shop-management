export const Label = ({ htmlFor, required, children, className = "" }) => {
    return (
        <label
            htmlFor={htmlFor}
            className={`block text-sm font-medium text-(--ink) ${className}`}
        >
            {children} {required && <span className="text-(--accent)">*</span>}
        </label>
    );
};
