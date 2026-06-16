import * as paymentService from "../services/general/memberSalaryChange.service.js";

export const create = async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({ success: true, msg: "Payment created successfully", data: payment });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.status(200).json({ success: true, msg: "Payments fetched successfully", data: payments });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, msg: "Payment not found" });
    res.status(200).json({ success: true, msg: "Payment fetched successfully", data: payment });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    if (!payment) return res.json({ success: false, msg: "Payment not found" });
    res.status(200).json({ success: true, msg: "Payment updated successfully", data: payment });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const payment = await paymentService.deletePayment(req.params.id);
    if (!payment) return res.status(404).json({ success: false, msg: "Payment not found" });
    res.status(200).json({ success: true, msg: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

export const getByMemberId = async (req, res) => {
  try {
    const payments = await paymentService.getPaymentOnCondition({ memberId: req.params.id });
    res.status(200).json({ success: true, msg: "Payments fetched successfully", data: payments });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
