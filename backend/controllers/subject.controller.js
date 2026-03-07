import Subject from "../models/Subject.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSubjects = asyncHandler(async (req, res) => {
  const { classLevelId, academicYearId } = req.query;
  const filter = {};
  if (classLevelId) filter.classLevelId = classLevelId;
  if (academicYearId) filter.academicYearId = academicYearId;

  if (req.user.role === "Teacher") {
    filter.teacherUserId = req.user._id;
  }

  const subjects = await Subject.find(filter)
    .populate("classLevelId", "name orderNumber")
    .populate("teacherUserId", "name email")
    .populate("academicYearId", "name")
    .sort({ name: 1 });
  res.json(subjects);
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, classLevelId, teacherUserId, academicYearId, description } = req.body || {};
  if (!name || !code) {
    return res.status(400).json({ message: "name and code are required" });
  }
  const subject = await Subject.create({ name, code: String(code).toUpperCase(), classLevelId: classLevelId || undefined, teacherUserId, academicYearId, description });
  res.status(201).json(subject);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  res.json(subject);
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  res.json({ message: "Subject deleted" });
});
