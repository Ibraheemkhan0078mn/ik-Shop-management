import React, { useState } from "react";
import api from "@shared/services/axiosInstance.js";

const TeacherSalaryPaymentUpdateComp = ({ setVisible, teacherId, }) => {
  const [formData, setFormData] = useState({
    salaryAmount: "",
    paymentMethod: "cash",
    date: "",
    notes: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {


      const res = await api.post(
        `/teacherRoute/createTeacherSalaryPayment`,
        { ...formData, teacherId: teacherId }
      );

      if (res.data.success) {
        // setData(res.data.allTeacherPayments);
        setVisible(false);
      }
    } catch (err) {
      console.error("Submit Error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center brightness-90 z-[9999] p-4">
      <div className="w-[80%] max-w-xl bg-white rounded-2xl shadow-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1c6f48]">Add Salary Payment</h2>
          <button
            onClick={() => setVisible(false)}
            className="text-zinc-500 hover:text-red-500 text-2xl"
          >
            &times;
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-[#1c6f48] mb-1">Salary Amount</label>
            <input
              type="number"
              onWheel={(e) => e.target.blur()}
              name="salaryAmount"
              value={formData.salaryAmount}
              onChange={handleChange}
              className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1c6f48] mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="bankAccount">Bank Account</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1c6f48] mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1c6f48] mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border border-zinc-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-400 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1c6f48] text-white py-2 rounded-lg font-bold hover:bg-[#155e3d] shadow-md hover:shadow-lg transition-all"
          >
            Create Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherSalaryPaymentUpdateComp;