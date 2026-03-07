import ClassLevel from "../models/ClassLevel.js";
import Section from "../models/Section.js";
import ClassSubject from "../models/ClassSubject.js";
import Subject from "../models/Subject.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── CRUD: Class Levels ─────────────────────────────────────────────────────

export const createClassLevel = asyncHandler(async (req, res) => {
  const { name, orderNumber, subjectIds } = req.body || {};
  if (!name || orderNumber === undefined) {
    return res.status(400).json({ message: "name and orderNumber required" });
  }
  const created = await ClassLevel.create({ name, orderNumber });

  // Assign subjects if provided
  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    const unique = [...new Set(subjectIds)];
    const docs = unique.map((sid) => ({ classLevelId: created._id, subjectId: sid }));
    await ClassSubject.insertMany(docs, { ordered: false }).catch(() => {});
  }

  res.status(201).json(created);
});

export const listClassLevels = asyncHandler(async (req, res) => {
  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    const items = await ClassLevel.find({ _id: { $in: allowedClassIds } }).sort({ orderNumber: 1 });
    return res.json(items);
  }

  const items = await ClassLevel.find().sort({ orderNumber: 1 });
  res.json(items);
});

export const updateClassLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, orderNumber, subjectIds } = req.body || {};
  if (!name || orderNumber === undefined) {
    return res.status(400).json({ message: "name and orderNumber required" });
  }
  const updated = await ClassLevel.findByIdAndUpdate(
    id,
    { name, orderNumber },
    { new: true, runValidators: true }
  );
  if (!updated) return res.status(404).json({ message: "Class not found" });

  // If subjectIds is provided, completely replace subject assignments
  if (Array.isArray(subjectIds)) {
    await ClassSubject.deleteMany({ classLevelId: id });
    if (subjectIds.length > 0) {
      const unique = [...new Set(subjectIds)];
      const docs = unique.map((sid) => ({ classLevelId: id, subjectId: sid }));
      await ClassSubject.insertMany(docs, { ordered: false }).catch(() => {});
    }
  }

  res.json(updated);
});

export const deleteClassLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cls = await ClassLevel.findById(id);
  if (!cls) return res.status(404).json({ message: "Class not found" });

  // Remove all sections and subject assignments belonging to this class
  await Section.deleteMany({ classLevelId: id });
  await ClassSubject.deleteMany({ classLevelId: id });
  await cls.deleteOne();
  res.json({ message: "Class and its sections deleted" });
});

// ── Subject Assignments for a Class ───────────────────────────────────────

/**
 * GET /api/classes/:id/subjects
 * Returns all subjects currently assigned to a class.
 */
export const getClassSubjects = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assignments = await ClassSubject.find({ classLevelId: id })
    .populate("subjectId", "name code description");
  const subjects = assignments.map((a) => a.subjectId).filter(Boolean);
  res.json(subjects);
});

/**
 * POST /api/classes/:id/subjects
 * Body: { subjectIds: ["id1", "id2", ...] }
 * Replaces ALL subject assignments for the class with the given list.
 */
export const setClassSubjects = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subjectIds } = req.body || {};
  if (!Array.isArray(subjectIds)) {
    return res.status(400).json({ message: "subjectIds must be an array" });
  }

  const cls = await ClassLevel.findById(id);
  if (!cls) return res.status(404).json({ message: "Class not found" });

  // Validate that all subjectIds exist
  if (subjectIds.length > 0) {
    const foundSubjects = await Subject.find({ _id: { $in: subjectIds } }).select("_id");
    if (foundSubjects.length !== new Set(subjectIds).size) {
      return res.status(400).json({ message: "One or more subject IDs are invalid" });
    }
  }

  // Replace all assignments atomically
  await ClassSubject.deleteMany({ classLevelId: id });
  if (subjectIds.length > 0) {
    const unique = [...new Set(subjectIds)];
    const docs = unique.map((sid) => ({ classLevelId: id, subjectId: sid }));
    await ClassSubject.insertMany(docs, { ordered: false });
  }

  // Return the updated list
  const updated = await ClassSubject.find({ classLevelId: id })
    .populate("subjectId", "name code description");
  res.json(updated.map((a) => a.subjectId).filter(Boolean));
});