import React,{ useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({ children, onConfirm, message = "Are you sure?" }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <span onClick={() => setOpen(true)}>{children}</span>

            {open && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                        style={{ animation: "fadeIn 0.2s ease" }}
                    />

                    {/* Dialog */}
                    <div
                        className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-sm p-8 flex flex-col items-center gap-6 overflow-hidden"
                        style={{ animation: "macPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
                            <i className="ri-alert-line text-2xl text-cyan-400" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Confirm Action</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
                        </div>

                        <div className="w-full h-px bg-slate-100" />

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { onConfirm(); setOpen(false); }}
                                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg"
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
                document.body  // 👈 renders directly into <body>, escapes all parent containers
            )}
        </>
    );
}