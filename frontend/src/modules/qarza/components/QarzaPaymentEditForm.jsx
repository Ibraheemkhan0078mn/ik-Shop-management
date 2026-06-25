import React, { useEffect, useState } from "react";

import api from "../../../shared/services/axiosInstance.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function QarzaPaymentEditForm({ getAccountPaymentAndSummary, currentToUpdateData, setQarzaPaymentData, setVisibility, qarzaAccountId }) {
  const [formData, setFormData] = useState({
    _id: "",
    amount: "",
    type: "cashin",
    date: "",
    notes: "",
    qarzaAccountId: ''
  });







  useEffect(() => {
    setFormData({
      ...currentToUpdateData,
      date: currentToUpdateData?.date?.split("T")[0]
    })


  }, [currentToUpdateData])




















  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };









  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.put(`/qarzaRoutes/updateQarzaPayment`, formData);
      if (res.data.success) {
        showSuccess("Payment updated successfully");
        setVisibility(false)
        getAccountPaymentAndSummary()
      } else {
        showError("Failed to update payment");
      }
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || "Failed to update payment");
    }
  };



  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
      {/* Backdrop with High-End Glass Blur */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={() => setVisibility(false)}
      />

      {/* Main Form Container */}
      <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Glossy Header Area */}
        <div className="relative p-8 border-b border-slate-100 bg-gradient-to-br from-white via-white to-cyan-50/30">
          <button
            onClick={() => setVisibility(false)}
            className="absolute top-8 right-8 h-10 w-10 rounded-full flex justify-center items-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:rotate-90 transition-all duration-300 group"
          >
            <i className="ri-close-line text-xl transition-transform group-hover:scale-110"></i>
          </button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500 rounded-xl shadow-lg shadow-cyan-200 text-white">
                <i className="ri-edit-box-line text-xl"></i>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                Edit <span className="text-cyan-500">Qarza</span>
              </h1>
            </div>
            <p className="text-sm font-semibold text-slate-400 mt-2 ml-1 flex items-center gap-2">
              <i className="ri-history-line text-cyan-400"></i>
              Updating transaction details
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form className="p-8 space-y-6 bg-slate-50/30" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Update Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full bg-white pl-8 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-700"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Change Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-white px-4 py-4 rounded-2xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Type Selection (Upgraded from Dropdown to Modern Toggles) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Transaction Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="cashin"
                  checked={formData.type === "cashin"}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-400 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 peer-checked:shadow-lg peer-checked:shadow-emerald-100 transition-all duration-300">
                  <i className="ri-arrow-left-down-line text-lg"></i>
                  Cash In
                </div>
              </label>
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="cashout"
                  checked={formData.type === "cashout"}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-400 peer-checked:bg-rose-500 peer-checked:text-white peer-checked:border-rose-500 peer-checked:shadow-lg peer-checked:shadow-rose-100 transition-all duration-300">
                  <i className="ri-arrow-right-up-line text-lg"></i>
                  Cash Out
                </div>
              </label>
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Edit Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full bg-white px-4 py-4 rounded-2xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium text-slate-600 h-28 resize-none"
              placeholder="Modify notes for this record..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-cyan-600 hover:shadow-cyan-100 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <i className="ri-refresh-line text-xl animate-spin-slow"></i>
            Update Transaction
          </button>
        </form>
      </div>
    </div>

  );
}

