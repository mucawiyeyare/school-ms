import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";
import Student from "../models/Student.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const takeAttendance = asyncHandler(async (req, res) => {
  const { academicYearId, classLevelId, sectionId, date, period, records } = req.body || {};
  if (!academicYearId || !classLevelId || !sectionId || !date || !Array.isArray(records)) {
    return res.status(400).json({ message: "academicYearId, classLevelId, sectionId, date, records[] required" });
  }

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    if (!allowedClassIds.includes(classLevelId.toString())) {
      return res.status(403).json({ message: "Not authorized to take attendance for this class" });
    }
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await Attendance.findOne({
    classLevelId,
    sectionId,
    date: { $gte: dayStart, $lte: dayEnd },
    period: period || "Morning"
  });

  if (existing) {
    if (req.user.role === "Teacher") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      if (existing.date < today || existing.date > todayEnd) {
        return res.status(403).json({ message: "Teachers can only edit attendance for the current day" });
      }
    }
    existing.records = records;
    existing.takenBy = req.user._id;
    await existing.save();
    return res.json(existing);
  }

  const attendance = await Attendance.create({
    academicYearId,
    classLevelId,
    sectionId,
    date: dayStart,
    period: period || "Morning",
    takenBy: req.user._id,
    records
  });
  res.status(201).json(attendance);
});

export const getAttendance = asyncHandler(async (req, res) => {
  const { classLevelId, sectionId, date, academicYearId } = req.query;
  const filter = {};
  if (classLevelId) filter.classLevelId = classLevelId;
  if (sectionId) filter.sectionId = sectionId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(date);
    dEnd.setHours(23, 59, 59, 999);
    filter.date = { $gte: d, $lte: dEnd };
  }

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    if (allowedClassIds.length === 0) {
      return res.json([]);
    }

    if (filter.classLevelId) {
      if (!allowedClassIds.includes(filter.classLevelId.toString())) {
        return res.status(403).json({ message: "Not authorized to view attendance for this class" });
      }
    } else {
      filter.classLevelId = { $in: allowedClassIds };
    }
  }

  const attendance = await Attendance.find(filter)
    .populate("classLevelId", "name")
    .populate("sectionId", "name")
    .populate("academicYearId", "name")
    .populate("records.studentId", "firstName lastName")
    .sort({ date: -1 });
  res.json(attendance);
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { academicYearId } = req.query;

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    const st = await Student.findById(studentId);
    if (st && !allowedClassIds.includes(st.classLevelId?.toString())) {
      return res.status(403).json({ message: "Not authorized to view attendance for this student" });
    }
  }

  const filter = { "records.studentId": studentId };
  if (academicYearId) filter.academicYearId = academicYearId;

  const records = await Attendance.find(filter)
    .populate("classLevelId", "name")
    .populate("sectionId", "name")
    .sort({ date: -1 });

  const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  const detail = [];

  for (const att of records) {
    const rec = att.records.find((r) => String(r.studentId) === String(studentId));
    if (rec) {
      summary[rec.status] = (summary[rec.status] || 0) + 1;
      summary.total += 1;
      detail.push({ date: att.date, period: att.period, status: rec.status, note: rec.note });
    }
  }

  res.json({ summary, detail });
});
