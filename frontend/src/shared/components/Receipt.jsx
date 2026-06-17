import React, { useRef } from 'react';
import { Printer, Phone, Globe, ShieldCheck, X } from 'lucide-react';
import logoImage from "@shared/assets/images/boy-user.jpg";

const TransactionReceipt = ({ data, setVisibility }) => {
    const componentRef = useRef();

    // Print function
    // const handlePrint = useReactToPrint({
    //     content: () => componentRef.current,
    //     documentTitle: `Receipt_${data?.receiptNo || '001'}`,
    // });

    const handlePrint = () => {
        // TODO: Implement print functionality when printElementAsPdf service is available
        console.log("Print functionality not yet implemented");
    }


    if (!data) return null;

    // Calculation logic inside component to keep parent clean
    const totalAmount = Object.values(data.items || {}).reduce((acc, val) =>
        acc + (parseFloat(val) || 0), 0
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 app-overlay app-enter">

            <div className="relative w-full max-w-2xl bg-surface shadow-2xl rounded-2xl overflow-hidden app-enter">

                {/* Actions Header (Not for Print) */}
                <div className="bg-surface-muted p-4 border-b flex justify-between items-center print:hidden">
                    <span className="text-ink-muted font-bold text-xs uppercase tracking-widest">Preview Mode</span>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-primary hover:bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg shadow-sm"
                        >
                            <Printer size={16} /> Save PDF / Print
                        </button>
                        <button
                            onClick={() => setVisibility(false)}
                            className="bg-danger-muted hover:bg-danger-muted text-danger p-2 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Printable Area */}
                <div ref={componentRef} className="p-8 bg-surface">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-edge-brand pb-6 mb-6">
                        <div className="flex items-center gap-4">
                            <img src={logoImage} alt="Logo" className="h-16 w-16 object-contain border border-edge rounded-xl p-1" />
                            <div>
                                <h1 className="text-2xl font-black text-primary-hover leading-tight">Syed Software Institute</h1>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">EDC System</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-primary font-black text-2xl">RECEIPT</div>
                            <p className="text-ink-subtle text-[10px] font-mono">No: {data.receiptNo}</p>
                            <p className="text-ink-subtle text-[10px] font-mono">{data.date}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="bg-primary-muted p-4 rounded-2xl border border-edge-brand">
                            <h3 className="text-primary-hover text-[10px] font-black uppercase mb-2">Student Information</h3>
                            <p className="font-bold text-ink uppercase">{data.name}</p>
                            <p className="text-xs text-ink-muted">ID: {data.id}</p>
                            <p className="text-xs text-ink-muted">{data.extraInfo}</p>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                            <h3 className="text-primary-hover text-[10px] font-black uppercase mb-1">Payment Method</h3>
                            <p className="font-bold text-ink">{data.method || 'Cash'}</p>
                            <div className="mt-2 inline-flex items-center gap-1 justify-end text-success">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verified Payment</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-edge text-[11px] font-black text-primary-hover uppercase tracking-wider">
                                    <th className="py-3 text-left">Description</th>
                                    <th className="py-3 text-right">Amount (PKR  )</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-edge">
                                {Object.entries(data.items || {}).map(([key, value]) => (
                                    <tr key={key}>
                                        <td className="py-4 text-sm text-ink-muted capitalize">{key.replace(/_/g, ' ')}</td>
                                        <td className="py-4 text-sm font-bold text-ink text-right">{parseFloat(value).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total */}
                    <div className="flex justify-end border-t-2 border-edge-brand pt-6">
                        <div className="w-1/2 space-y-2">
                            <div className="flex justify-between items-center bg-primary-hover text-primary-foreground p-4 rounded-2xl shadow-xl shadow-sm">
                                <span className="font-bold text-sm uppercase">Total Received</span>
                                <span className="font-black text-xl">Rs {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Advertisement */}
                    <div className="mt-12 pt-6 border-t border-dashed border-edge text-center">
                        <div className="flex justify-center gap-6 text-ink-subtle mb-4">
                            <div className="flex items-center gap-1 text-[11px]"><Phone size={12} /> +92 3213268095</div>
                            <div className="flex items-center gap-1 text-[11px]"><Globe size={12} /> ssibannu.com</div>
                        </div>
                        <p className="text-[12px] font-bold text-primary">SSIB - Professional Software Team</p>
                        <p className="text-[9px] text-ink-subtle mt-1 italic uppercase tracking-[0.2em]">Empowering Education Through Innovation</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionReceipt;