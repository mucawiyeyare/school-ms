import Result from "../models/Result.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";
import Student from "../models/Student.js";
import ExamTerm from "../models/ExamTerm.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getResults = asyncHandler(async (req, res) => {
  const { examTermId, studentId, subjectId, classLevelId } = req.query;
  const filter = {};
  if (examTermId) filter.examTermId = examTermId;
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const teacherSubjectIds = subjects.map(s => s._id.toString());
    
    if (teacherSubjectIds.length === 0) {
      return res.json([]);
    }

    if (filter.subjectId) {
      if (!teacherSubjectIds.includes(filter.subjectId.toString())) {
        return res.status(403).json({ message: "Not authorized to view results for this subject" });
      }
    } else {
      filter.subjectId = { $in: teacherSubjectIds };
    }
  }

  let results = await Result.find(filter)
    .populate("studentId", "firstName lastName")
    .populate("subjectId", "name code")
    .populate("examTermId", "name")
    .sort({ createdAt: -1 });

  // Filter by classLevelId via subject if provided
  if (classLevelId) {
    const classSubjects = await Subject.find({ classLevelId }).select("_id");
    const subjectIds = classSubjects.map((s) => String(s._id));
    results = results.filter((r) => subjectIds.includes(String(r.subjectId?._id)));
  }

  res.json(results);
});

export const bulkUpsertResults = asyncHandler(async (req, res) => {
  const { results } = req.body || {};
  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ message: "results[] array required" });
  }

  if (req.user.role === "Teacher") {
    const termIds = [...new Set(results.map(r => r.examTermId))];
    for (const tid of termIds) {
       const term = await ExamTerm.findById(tid);
       if (term && term.status === "completed") {
         return res.status(403).json({ message: "Cannot edit marks for a completed exam term" });
       }
    }

    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const teacherSubjectIds = subjects.map(s => s._id.toString());
    const classSubjects = await ClassSubject.find({ subjectId: { $in: teacherSubjectIds } });
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    for (const r of results) {
      if (!teacherSubjectIds.includes(r.subjectId?.toString())) {
        return res.status(403).json({ message: "Not authorized to enter marks for one or more subjects" });
      }
      const st = await Student.findById(r.studentId);
      if (st && !allowedClassIds.includes(st.classLevelId?.toString())) {
         return res.status(403).json({ message: "Not authorized to enter marks for a student in this class" });
      }
    }
  }

  const saved = [];
  for (const r of results) {
    const { studentId, examTermId, subjectId, marksObtained, maxMarks, remarks } = r;
    if (!studentId || !examTermId || !subjectId || marksObtained == null || !maxMarks) continue;
    const doc = await Result.findOneAndUpdate(
      { studentId, examTermId, subjectId },
      { marksObtained, maxMarks, remarks, enteredBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );
    saved.push(doc);
  }
  res.json({ saved: saved.length, results: saved });
});

export const getReportCard = asyncHandler(async (req, res) => {
  const { studentId, examTermId } = req.params;

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    const st = await Student.findById(studentId);
    if (st && !allowedClassIds.includes(st.classLevelId?.toString())) {
      return res.status(403).json({ message: "Not authorized to view report cards for this student's class" });
    }
  }

  const [student, results] = await Promise.all([
    Student.findById(studentId),
    Result.find({ studentId, examTermId })
      .populate("subjectId", "name code")
      .populate("examTermId", "name")
  ]);

  if (!student) return res.status(404).json({ message: "Student not found" });

  const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = results.reduce((sum, r) => sum + r.maxMarks, 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;

  res.json({
    student: { _id: student._id, firstName: student.firstName, lastName: student.lastName },
    examTerm: results[0]?.examTermId || examTermId,
    results,
    summary: { totalObtained, totalMax, percentage }
  });
});
