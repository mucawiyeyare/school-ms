import Student from "../models/Student.js";
import PromotionLog from "../models/PromotionLog.js";
import AcademicYear from "../models/AcademicYear.js";
import Enrollment from "../models/Enrollment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// PREVIEW (no transaction needed)
export const previewPromotions = asyncHandler(async (req, res) => {
  const { fromAcademicYearId, toAcademicYearId, fromClassLevelId, sectionId } = req.body || {};

  if (!fromAcademicYearId || !toAcademicYearId || !fromClassLevelId) {
    return res.status(400).json({
      message: "fromAcademicYearId, toAcademicYearId, fromClassLevelId required"
    });
  }

  const [fromY, toY] = await Promise.all([
    AcademicYear.findById(fromAcademicYearId),
    AcademicYear.findById(toAcademicYearId)
  ]);

  if (!fromY || !toY) return res.status(404).json({ message: "Academic year not found" });

  const filter = {
    academicYearId: fromAcademicYearId,
    classLevelId: fromClassLevelId,
    status: "active"
  };

  if (sectionId) filter.sectionId = sectionId;

  const students = await Student.find(filter)
    .populate("classLevelId")
    .populate("sectionId");

  // Map to match the frontend shape which expects 'enrollments' array 
  // with a populated 'studentId' object
  const enrollments = students.map(st => ({
    _id: st._id, 
    studentId: st,
    classLevelId: st.classLevelId,
    sectionId: st.sectionId,
    status: st.status
  }));

  res.json({
    fromAcademicYear: fromY,
    toAcademicYear: toY,
    count: enrollments.length,
    enrollments
  });
});

// EXECUTE (NO TRANSACTIONS - works on standalone MongoDB)
export const executePromotions = asyncHandler(async (req, res) => {
  const { fromAcademicYearId, toAcademicYearId, decisions } = req.body || {};

  if (!fromAcademicYearId || !toAcademicYearId || !Array.isArray(decisions) || decisions.length === 0) {
    return res.status(400).json({
      message: "fromAcademicYearId, toAcademicYearId, decisions[] required"
    });
  }

  const [fromY, toY] = await Promise.all([
    AcademicYear.findById(fromAcademicYearId),
    AcademicYear.findById(toAcademicYearId)
  ]);

  if (!fromY || !toY) return res.status(404).json({ message: "Academic year not found" });

  const summary = { promoted: 0, repeated: 0, graduated: 0, transferred: 0, skipped: 0 };
  const results = [];

  for (const d of decisions) {
    const { studentId, action, toClassLevelId, toSectionId, reason } = d || {};

    if (!studentId || !action) {
      summary.skipped++;
      results.push({ studentId, ok: false, message: "studentId and action required" });
      continue;
    }

    const current = await Student.findById(studentId);

    if (!current || current.academicYearId?.toString() !== fromAcademicYearId) {
      summary.skipped++;
      results.push({ studentId, ok: false, message: "Student not currently in 'from' academic year" });
      continue;
    }

    if (current.academicYearId?.toString() === toAcademicYearId) {
      summary.skipped++;
      results.push({ studentId, ok: false, message: "Already promoted to target academic year" });
      continue;
    }

    if (action === "promoted" || action === "repeated") {
      if (!toClassLevelId || !toSectionId) {
        summary.skipped++;
        results.push({ studentId, ok: false, message: "toClassLevelId and toSectionId required" });
        continue;
      }

      // Capture BEFORE mutation
      const fromClassId = current.classLevelId;
      const fromSectionId = current.sectionId;
      const rollNumber = current.rollNumber;

      current.academicYearId = toAcademicYearId;
      current.classLevelId = toClassLevelId;
      current.sectionId = toSectionId;
      // keep status as active
      await current.save();

      // Create new enrollment for the target year (upsert to avoid dup key)
      await Enrollment.findOneAndUpdate(
        { studentId, academicYearId: toAcademicYearId },
        { classLevelId: toClassLevelId, sectionId: toSectionId, rollNo: rollNumber, status: "active" },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await PromotionLog.create({
        studentId,
        fromAcademicYearId,
        toAcademicYearId,
        fromClassLevelId: fromClassId,
        fromSectionId,
        toClassLevelId,
        toSectionId,
        action,
        reason,
        performedBy: req.user._id
      });

      summary[action] += 1;
      results.push({ studentId, ok: true, action });
      continue;
    }

    if (action === "graduated" || action === "transferred") {
      // Capture BEFORE mutation
      const fromClassId = current.classLevelId;
      const fromSectionId = current.sectionId;
      current.status = action === "graduated" ? "graduated" : "transferred";
      await current.save();

      await PromotionLog.create({
        studentId,
        fromAcademicYearId,
        toAcademicYearId,
        fromClassLevelId: fromClassId,
        fromSectionId,
        toClassLevelId: undefined,
        toSectionId: undefined,
        action,
        reason,
        performedBy: req.user._id
      });

      summary[action] += 1;
      results.push({ studentId, ok: true, action });
      continue;
    }

    summary.skipped++;
    results.push({ studentId, ok: false, message: "Invalid action" });
  }

  res.json({
    message: "Promotion executed",
    fromAcademicYear: fromY.name,
    toAcademicYear: toY.name,
    summary,
    results
  });
});