import React from "react";

const formatAmount = (value) => `Rs ${(Number(value) || 0).toLocaleString()}`;
const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function SupplierTransactionsPdfTemplate({ supplier = {}, transactions = [], summary = {}, source = "all" }) {
    const sourceLabel = source === "all" ? "All Transactions" : source === "purchaseReturn" ? "Purchase Returns" : source === "purchase" ? "Purchases" : "Manual Transactions";
    const totalIn = transactions.reduce((total, item) => total + (item.creditType === "cashin" ? Number(item.amount) || 0 : 0), 0);
    const totalOut = transactions.reduce((total, item) => total + (item.creditType !== "cashin" ? Number(item.amount) || 0 : 0), 0);

    return (
        <div className="min-h-screen bg-white p-10 text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>
            <div className="mb-6 border-b-2 border-gray-300 pb-4 text-center">
                <div className="mb-2 inline-flex flex-col items-center leading-none">
                    <span className="text-3xl font-extrabold tracking-wide text-gray-900" style={{ letterSpacing: "2px" }}>LOGIN</span>
                    <span className="mt-1 text-xs font-semibold tracking-[0.3em] text-gray-500">LARAIB</span>
                </div>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Supplier Credits &amp; Debits</h1>
                <p className="mt-1 text-sm text-gray-500">{sourceLabel}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Supplier Information</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between border border-gray-300 px-3 py-2"><span className="text-gray-500">Name</span><strong>{supplier.name || "—"}</strong></div>
                        <div className="flex justify-between border border-gray-300 px-3 py-2"><span className="text-gray-500">Phone</span><strong>{supplier.phoneNo || "—"}</strong></div>
                        <div className="flex justify-between border border-gray-300 px-3 py-2"><span className="text-gray-500">Address</span><strong>{supplier.address || "—"}</strong></div>
                    </div>
                </div>
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Account Summary</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between border border-gray-300 px-3 py-2"><span className="text-gray-500">Cash In</span><strong className="text-green-700">{formatAmount(summary.cashIn)}</strong></div>
                        <div className="flex justify-between border border-gray-300 px-3 py-2"><span className="text-gray-500">Cash Out</span><strong className="text-red-600">{formatAmount(summary.cashOut)}</strong></div>
                        <div className="flex justify-between border border-gray-300 px-3 py-2"><span className="text-gray-500">Current Balance</span><strong>{formatAmount(summary.overall)}</strong></div>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex justify-between text-sm font-semibold">
                <span>Filtered Transactions: {transactions.length}</span>
                <span className="text-green-700">In: {formatAmount(totalIn)} <span className="ml-3 text-red-600">Out: {formatAmount(totalOut)}</span></span>
            </div>

            <table className="mb-6 w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Source</th>
                        <th className="px-3 py-2 text-left">Payment Method</th>
                        <th className="px-3 py-2 text-left">Details</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((item, index) => {
                        const isCashIn = item.creditType === "cashin";
                        return <tr key={item._id || index} className="border-b border-gray-200">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">{formatDate(item.transactionDate || item.date)}</td>
                            <td className={`px-3 py-2 font-semibold uppercase ${isCashIn ? "text-green-700" : "text-red-600"}`}>{isCashIn ? "Credit" : "Debit"}</td>
                            <td className="px-3 py-2 capitalize">{item.sourceType === "purchaseReturn" ? "Purchase Return" : item.sourceType || "—"}</td>
                            <td className="px-3 py-2">{item.paymentMethodName || item.paymentMethod?.name || "—"}</td>
                            <td className="px-3 py-2 text-gray-600">{item.notes || item.note || item.reference || "—"}</td>
                            <td className={`px-3 py-2 text-right font-bold ${isCashIn ? "text-green-700" : "text-red-600"}`}>{formatAmount(item.amount)}</td>
                        </tr>;
                    })}
                    {!transactions.length && <tr><td colSpan="7" className="px-3 py-8 text-center text-gray-500">No transactions found for this filter.</td></tr>}
                </tbody>
            </table>

            <div className="flex justify-between border-t border-gray-300 pt-3 text-xs text-gray-500">
                <span>This is a computer generated document.</span>
                <span>Print Time: {new Date().toLocaleString()}</span>
            </div>
        </div>
    );
}