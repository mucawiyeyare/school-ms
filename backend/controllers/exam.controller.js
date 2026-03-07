import Exam from "../models/Exam.js";
import ExamSubject from "../models/ExamSubject.js";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ─────────────────────────── EXAM CRUD ─────────────────────────── */

export const getExams = asyncHandler(async (req, res) => {
  const { academicYearId, status, type } = req.query;
  const filter = {};
  if (academicYearId) filter.academicYearId = academicYearId;
  if (status) filter.status = status;
  if (type) filter.type = type;

  const exams = await Exam.find(filter)
    .populate("academicYearId", "name")
    .populate("createdBy", "name")
    .populate("publishedBy", "name")
    .sort({ createdAt: -1 });

  res.json(exams);
});

export const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate("academicYearId", "name")
    .populate("createdBy", "name")
    .populate("publishedBy", "name");
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

export const createExam = asyncHandler(async (req, res) => {
  const { name, type, academicYearId, term, startDate, endDate, description } = req.body || {};
  if (!name || !academicYearId) {
    return res.status(400).json({ message: "name and academicYearId are required" });
  }
  const exam = await Exam.create({
    name, type, academicYearId, term, startDate, endDate, description,
    status: "draft",
    createdBy: req.user._id,
  });
  res.status(201).json(exam);
});

export const updateExam = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "type", "academicYearId", "term", "startDate", "endDate", "description", "status"];
  const updates = {};
  for (const f of allowedFields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const exam = await Exam.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  // Cascade delete related exam-subjects and results
  await ExamSubject.deleteMany({ examId: exam._id });
  await Result.deleteMany({ examId: exam._id });
  await exam.deleteOne();
  res.json({ message: "Exam and all related data deleted" });
});

/* ─────────────────────── PUBLISH / UNPUBLISH ─────────────────────── */

export const publishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  exam.status = "published";
  exam.publishedAt = new Date();
  exam.publishedBy = req.user._id;
  await exam.save();
  res.json({ message: "Exam published successfully", exam });
});

export const unpublishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  exam.status = "completed";
  exam.publishedAt = undefined;
  exam.publishedBy = undefined;
  await exam.save();
  res.json({ message: "Exam unpublished", exam });
});

/* ─────────────────────── EXAM SUBJECTS ─────────────────────── */

export const getExamSubjects = asyncHandler(async (req, res) => {
  const { examId, classLevelId } = req.query;
  const filter = {};
  if (examId) filter.examId = examId;
  if (classLevelId) filter.classLevelId = classLevelId;

  const examSubjects = await ExamSubject.find(filter)
    .populate("subjectId", "name code")
    .populate("classLevelId", "name orderNumber")
    .populate("sectionId", "name")
    .populate("examId", "name type status");

  res.json(examSubjects);
});

export const upsertExamSubject = asyncHandler(async (req, res) => {
  const { examId, subjectId, classLevelId, sectionId, totalMarks, passingMarks, examDate, durationMins } = req.body || {};
  if (!examId || !subjectId || !classLevelId) {
    return res.status(400).json({ message: "examId, subjectId, classLevelId are required" });
  }
  const es = await ExamSubject.findOneAndUpdate(
    { examId, subjectId, classLevelId },
    { sectionId: sectionId || undefined, totalMarks, passingMarks, examDate, durationMins },
    { upsert: true, new: true, runValidators: true }
  );
  res.json(es);
});

export const deleteExamSubject = asyncHandler(async (req, res) => {
  const es = await ExamSubject.findByIdAndDelete(req.params.id);
  if (!es) return res.status(404).json({ message: "ExamSubject not found" });
  res.json({ message: "Removed" });
});

/* ─────────────────────── MARKS ENTRY ─────────────────────── */

export const bulkUpsertMarks = asyncHandler(async (req, res) => {
  const { results } = req.body || {};
  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ message: "results[] array required" });
  }

  // Teacher guard – can only enter marks for their subjects
  if (req.user.role === "Teacher") {
    const mySubjects = await Subject.find({ teacherUserId: req.user._id }).select("_id classLevelId");
    const mySubjectIds = mySubjects.map(s => s._id.toString());
    const myClassIds = mySubjects.map(s => s.classLevelId?.toString()).filter(Boolean);

    const csRows = await ClassSubject.find({ subjectId: { $in: mySubjectIds } });
    const csClassIds = csRows.map(cs => cs.classLevelId?.toString()).filter(Boolean);
    const allowedClassIds = [...new Set([...myClassIds, ...csClassIds])];

    for (const r of results) {
      if (!mySubjectIds.includes(r.subjectId?.toString())) {
        return res.status(403).json({ message: "Not authorized for one or more subjects" });
      }
      if (r.studentId) {
        const st = await Student.findById(r.studentId).select("classLevelId");
        if (st && !allowedClassIds.includes(st.classLevelId?.toString())) {
          return res.status(403).json({ message: "Not authorized for this student's class" });
        }
      }
    }
  }

  const saved = [];
  for (const r of results) {
    const { studentId, examId, subjectId, marksObtained, maxMarks, passingMarks, remarks, classLevelId, sectionId } = r;
    if (!studentId || !examId || !subjectId || marksObtained == null || !maxMarks) continue;
    const doc = await Result.findOneAndUpdate(
      { studentId, examId, subjectId },
      { marksObtained, maxMarks, passingMarks: passingMarks || 0, remarks, classLevelId, sectionId, enteredBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );
    saved.push(doc);
  }

  // Compute ranks per subject within the exam
  await _computeRanks(saved.map(s => ({ examId: s.examId, subjectId: s.subjectId })));

  res.json({ saved: saved.length, results: saved });
});

/* helper: recompute rank for each subject within the exam */
async function _computeRanks(pairs) {
  const unique = [...new Map(pairs.map(p => [`${p.examId}-${p.subjectId}`, p])).values()];
  for (const { examId, subjectId } of unique) {
    const rows = await Result.find({ examId, subjectId }).sort({ marksObtained: -1 });
    for (let i = 0; i < rows.length; i++) {
      rows[i].rank = i + 1;
      await rows[i].save();
    }
  }
}

/* ─────────────────────── RESULTS / REPORT CARD ─────────────────────── */

export const getResults = asyncHandler(async (req, res) => {
  const { examId, studentId, subjectId, classLevelId, sectionId } = req.query;
  const filter = {};
  if (examId) filter.examId = examId;
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (classLevelId) filter.classLevelId = classLevelId;
  if (sectionId) filter.sectionId = sectionId;

  // Teachers can only see their own subjects
  if (req.user.role === "Teacher") {
    const mySubjects = await Subject.find({ teacherUserId: req.user._id }).select("_id");
    const myIds = mySubjects.map(s => s._id.toString());
    if (filter.subjectId) {
      if (!myIds.includes(filter.subjectId)) {
        return res.status(403).json({ message: "Not authorized for this subject" });
      }
    } else {
      filter.subjectId = { $in: myIds };
    }
  }

  // Students can only see their own results for published exams
  if (req.user.role === "Student") {
    const student = await Student.findOne({ studentUserId: req.user._id });
    if (!student) return res.json([]);
    filter.studentId = student._id;

    // filter to only published exams
    const publishedExams = await Exam.find({ status: "published" }).select("_id");
    filter.examId = { $in: publishedExams.map(e => e._id) };
  }

  const results = await Result.find(filter)
    .populate("studentId", "firstName lastName emisNumber classLevelId sectionId")
    .populate("subjectId", "name code")
    .populate("examId", "name type status publishedAt term")
    .populate("classLevelId", "name")
    .populate("sectionId", "name")
    .sort({ createdAt: -1 });

  res.json(results);
});

export const getReportCard = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;

  // Student role – can only view published exams
  if (req.user.role === "Student") {
    const student = await Student.findOne({ studentUserId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const exam = await Exam.findById(examId);
    if (!exam || exam.status !== "published") {
      return res.status(403).json({ message: "Result not published yet" });
    }
  }

  const [student, exam, results] = await Promise.all([
    Student.findById(studentId).populate("classLevelId", "name").populate("sectionId", "name"),
    Exam.findById(examId).populate("academicYearId", "name"),
    Result.find({ studentId, examId })
      .populate("subjectId", "name code")
  ]);

  if (!student) return res.status(404).json({ message: "Student not found" });
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = results.reduce((sum, r) => sum + r.maxMarks, 0);
  const totalPassing = results.reduce((sum, r) => sum + (r.passingMarks || 0), 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0.0";

  const overallGrade = (() => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B";
    if (pct >= 60) return "C";
    if (pct >= 50) return "D";
    return "F";
  })();

  const hasAnyFail = results.some(r => r.passFail === "Fail");
  const overallStatus = hasAnyFail ? "Fail" : "Pass";

  // Class rank – based on total marks in this exam for the class
  let classRank = null;
  if (student.classLevelId) {
    const allClassResults = await Result.aggregate([
      { $match: { examId: exam._id, classLevelId: student.classLevelId } },
      { $group: { _id: "$studentId", total: { $sum: "$marksObtained" } } },
      { $sort: { total: -1 } }
    ]);
    const myIdx = allClassResults.findIndex(r => r._id.toString() === studentId);
    if (myIdx >= 0) classRank = myIdx + 1;
  }

  res.json({
    student: {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      emisNumber: student.emisNumber,
      className: student.classLevelId?.name,
      sectionName: student.sectionId?.name,
    },
    exam: { _id: exam._id, name: exam.name, type: exam.type, term: exam.term, academicYear: exam.academicYearId?.name },
    results,
    summary: { totalObtained, totalMax, totalPassing, percentage, overallGrade, overallStatus, classRank },
  });
});

/* ─────────────────────── CLASS RESULT SHEET ─────────────────────── */

export const getClassResultSheet = asyncHandler(async (req, res) => {
  const { examId, classLevelId, sectionId } = req.query;
  if (!examId || !classLevelId) {
    return res.status(400).json({ message: "examId and classLevelId required" });
  }

  const filter = { examId, classLevelId };
  if (sectionId) filter.sectionId = sectionId;

  const results = await Result.find(filter)
    .populate("studentId", "firstName lastName emisNumber")
    .populate("subjectId", "name code");

  // Group by student
  const byStudent = {};
  for (const r of results) {
    const sid = r.studentId?._id?.toString();
    if (!sid) continue;
    if (!byStudent[sid]) {
      byStudent[sid] = {
        student: r.studentId,
        subjects: [],
        totalObtained: 0,
        totalMax: 0,
      };
    }
    byStudent[sid].subjects.push({
      subjectId: r.subjectId?._id,
      subjectName: r.subjectId?.name,
      subjectCode: r.subjectId?.code,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      passingMarks: r.passingMarks,
      grade: r.grade,
      passFail: r.passFail,
      rank: r.rank,
    });
    byStudent[sid].totalObtained += r.marksObtained;
    byStudent[sid].totalMax += r.maxMarks;
  }

  // Sort by total marks desc and add class rank
  const rows = Object.values(byStudent).sort((a, b) => b.totalObtained - a.totalObtained);
  rows.forEach((row, i) => {
    row.classRank = i + 1;
    const pct = row.totalMax > 0 ? (row.totalObtained / row.totalMax) * 100 : 0;
    row.percentage = pct.toFixed(1);
    row.overallGrade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "F";
    row.overallStatus = row.subjects.some(s => s.passFail === "Fail") ? "Fail" : "Pass";
  });

  res.json(rows);
});
