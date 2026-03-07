import ExamTerm from "../models/ExamTerm.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getExamTerms = asyncHandler(async (req, res) => {
  const { academicYearId } = req.query;
  const filter = {};
  if (academicYearId) filter.academicYearId = academicYearId;
  const terms = await ExamTerm.find(filter).populate("academicYearId", "name").sort({ createdAt: -1 });
  res.json(terms);
});

export const createExamTerm = asyncHandler(async (req, res) => {
  const { name, academicYearId, startDate, endDate, status } = req.body || {};
  if (!name || !academicYearId) return res.status(400).json({ message: "name, academicYearId required" });
  const term = await ExamTerm.create({ name, academicYearId, startDate, endDate, status });
  res.status(201).json(term);
});

export const updateExamTerm = asyncHandler(async (req, res) => {
  const term = await ExamTerm.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!term) return res.status(404).json({ message: "Exam term not found" });
  res.json(term);
});

export const deleteExamTerm = asyncHandler(async (req, res) => {
  const term = await ExamTerm.findByIdAndDelete(req.params.id);
  if (!term) return res.status(404).json({ message: "Exam term not found" });
  res.json({ message: "Exam term deleted" });
});
