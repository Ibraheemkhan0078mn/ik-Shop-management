import React,{ useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({ children, onConfirm, message = "Are you sure?" }) {
   console.log("The diaload is working. ")
    const [open, setOpen] = useState(false);

    const handleTriggerClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
    };

    const handleConfirm = () => {
        onConfirm();
        setOpen(false);
    };

    const childWithOnClick = React.cloneElement(children, {
        onClick: handleTriggerClick
    });

    return (
        <>
            {childWithOnClick}

            {open && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 app-overlay backdrop-blur-md"
                        style={{ animation: "fadeIn 0.2s ease" }}
                    />

                    {/* Dialog */}
                    <div
                        className="relative rounded-2xl shadow-2xl border w-full max-w-sm p-8 flex flex-col items-center gap-6 overflow-hidden"
                        style={{ 
                            background: 'var(--surface)',
                            borderColor: 'var(--border)',
                            animation: "macPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" 
                        }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full blur-2xl pointer-events-none" 
                             style={{ background: 'rgba(15, 118, 110, 0.2)' }} />

                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                             style={{ background: 'var(--ink)' }}>
                            <i className="ri-alert-line text-2xl" style={{ color: 'var(--accent-2)' }} />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--ink)' }}>Confirm Action</h3>
                            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--muted)' }}>{message}</p>
                        </div>

                        <div className="w-full h-px" style={{ background: 'var(--border)' }} />

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                style={{ 
                                    background: 'var(--surface-muted)',
                                    color: 'var(--muted)'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'var(--border)'}
                                onMouseLeave={(e) => e.target.style.background = 'var(--surface-muted)'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg"
                                style={{ 
                                    background: 'var(--ink)',
                                    color: '#ffffff'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'var(--accent-2)'}
                                onMouseLeave={(e) => e.target.style.background = 'var(--ink)'}
                            >
                                Yes, Confirm
                            </button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes macPop {
                            0% { transform: scale(0.7); opacity: 0; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                        @keyframes fadeIn {
                            from { opacity: 0; } to { opacity: 1; }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </>
    );
}