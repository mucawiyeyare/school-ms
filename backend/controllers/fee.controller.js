import FeeStructure from "../models/FeeStructure.js";
import FeePayment from "../models/FeePayment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Fee Structures ---
export const getFeeStructures = asyncHandler(async (req, res) => {
  const { academicYearId, classLevelId } = req.query;
  const filter = {};
  if (academicYearId) filter.academicYearId = academicYearId;
  if (classLevelId) filter.classLevelId = classLevelId;
  const structures = await FeeStructure.find(filter)
    .populate("academicYearId", "name")
    .populate("classLevelId", "name")
    .sort({ createdAt: -1 });
  res.json(structures);
});

export const createFeeStructure = asyncHandler(async (req, res) => {
  const { name, academicYearId, classLevelId, amount, dueDate, description } = req.body || {};
  if (!name || !academicYearId || amount == null) {
    return res.status(400).json({ message: "name, academicYearId, amount required" });
  }
  const structure = await FeeStructure.create({ name, academicYearId, classLevelId, amount, dueDate, description });
  res.status(201).json(structure);
});

export const updateFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!structure) return res.status(404).json({ message: "Fee structure not found" });
  res.json(structure);
});

export const deleteFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findByIdAndDelete(req.params.id);
  if (!structure) return res.status(404).json({ message: "Fee structure not found" });
  res.json({ message: "Fee structure deleted" });
});

// --- Payments ---
export const getPayments = asyncHandler(async (req, res) => {
  const { feeStructureId, studentId, status } = req.query;
  const filter = {};
  if (feeStructureId) filter.feeStructureId = feeStructureId;
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;
  const payments = await FeePayment.find(filter)
    .populate("feeStructureId", "name amount")
    .populate("studentId", "firstName lastName")
    .populate("recordedBy", "name")
    .sort({ paymentDate: -1 });
  res.json(payments);
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { feeStructureId, studentId, amountPaid, method, receiptNo, status, notes } = req.body || {};
  if (!feeStructureId || !studentId || amountPaid == null) {
    return res.status(400).json({ message: "feeStructureId, studentId, amountPaid required" });
  }
  const payment = await FeePayment.create({
    feeStructureId,
    studentId,
    amountPaid,
    method,
    receiptNo,
    status: status || "paid",
    notes,
    recordedBy: req.user._id
  });
  res.status(201).json(payment);
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await FeePayment.findByIdAndDelete(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  res.json({ message: "Payment deleted" });
});
