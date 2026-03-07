import Enrollment from "../models/Enrollment.js";
import AcademicYear from "../models/AcademicYear.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEnrollment = asyncHandler(async (req, res) => {
  const { studentId, academicYearId, classLevelId, sectionId, rollNo } = req.body || {};
  if (!studentId || !academicYearId || !classLevelId || !sectionId) {
    return res.status(400).json({ message: "studentId, academicYearId, classLevelId, sectionId required" });
  }

  const year = await AcademicYear.findById(academicYearId);
  if (!year) return res.status(404).json({ message: "Academic year not found" });

  const enrollment = await Enrollment.create({
    studentId,
    academicYearId,
    classLevelId,
    sectionId,
    rollNo,
    status: "active"
  });

  res.status(201).json(enrollment);
});

export const listEnrollments = asyncHandler(async (req, res) => {
  const { academicYearId, classLevelId, sectionId, studentId } = req.query;
  const filter = {};
  if (academicYearId) filter.academicYearId = academicYearId;
  if (classLevelId) filter.classLevelId = classLevelId;
  if (sectionId) filter.sectionId = sectionId;
  if (studentId) filter.studentId = studentId;

  const items = await Enrollment.find(filter)
    .populate("studentId")
    .populate("academicYearId")
    .populate("classLevelId")
    .populate("sectionId")
    .sort({ createdAt: -1 });

  res.json(items);
});
