// Built-in Dialog Component
export const DialogContent = ({ children }) => (
    <div className="p-6">{children}</div>
);
export const DialogHeader = ({ children }) => (
    <div className="mb-4">{children}</div>
);
export const DialogTitle = ({ children }) => (
    <h2 className="text-xl font-semibold text-(--ink)">{children}</h2>
);
export const DialogFooter = ({ children }) => (
    <div className="flex gap-3 justify-end mt-6">{children}</div>
);

export const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-(--surface-muted)0/50 bg-opacity-50"
                onClick={() => onOpenChange(false)}
            />
            <div className="relative bg-(--surface) rounded-xl shadow-xl max-w-md w-full mx-4 z-50">
                {children}
            </div>
        </div>
    );
};
