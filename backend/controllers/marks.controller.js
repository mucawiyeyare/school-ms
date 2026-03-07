import ExamType from "../models/ExamType.js";
import MarksRecord from "../models/MarksRecord.js";
import MarksEditLog from "../models/MarksEditLog.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import RankRecord from "../models/RankRecord.js";
import Enrollment from "../models/Enrollment.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import AcademicYear from "../models/AcademicYear.js";

// ─── EXAM TYPES ────────────────────────────────────────────────────────────────

/** GET /api/marks/exam-types  — list all exam types */
export const listExamTypes = async (req, res) => {
  try {
    const types = await ExamType.find().sort({ order: 1 });
    res.json(types);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** PUT /api/marks/exam-types/:code  — admin updates label/maxMarks/isEnabled */
export const updateExamType = async (req, res) => {
  try {
    const { label, maxMarks, isEnabled } = req.body;
    const et = await ExamType.findOneAndUpdate(
      { code: req.params.code },
      { ...(label !== undefined && { label }), ...(maxMarks !== undefined && { maxMarks }), ...(isEnabled !== undefined && { isEnabled }) },
      { new: true }
    );
    if (!et) return res.status(404).json({ message: "Exam type not found" });
    res.json(et);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── TEACHER SUBJECT ASSIGNMENTS ───────────────────────────────────────────────

/** GET /api/marks/assignments?teacherId=&classLevelId=&academicYearId= */
export const listAssignments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacherId)      filter.teacherId      = req.query.teacherId;
    if (req.query.classLevelId)   filter.classLevelId   = req.query.classLevelId;
    if (req.query.academicYearId) filter.academicYearId = req.query.academicYearId;

    const assignments = await TeacherSubjectAssignment.find(filter)
      .populate("teacherId",      "name email")
      .populate("subjectId",      "name code")
      .populate("classLevelId",   "name")
      .populate("sectionId",      "name")
      .populate("academicYearId", "name");
    res.json(assignments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** POST /api/marks/assignments — create assignment */
export const createAssignment = async (req, res) => {
  try {
    const { teacherId, subjectId, classLevelId, sectionId, academicYearId } = req.body;
    if (!teacherId || !subjectId || !classLevelId)
      return res.status(400).json({ message: "teacherId, subjectId, classLevelId are required" });

    const asgn = await TeacherSubjectAssignment.create({
      teacherId, subjectId, classLevelId,
      ...(sectionId && { sectionId }),
      ...(academicYearId && { academicYearId })
    });
    res.status(201).json(asgn);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: "Assignment already exists" });
    res.status(500).json({ message: e.message });
  }
};

/** DELETE /api/marks/assignments/:id */
export const deleteAssignment = async (req, res) => {
  try {
    await TeacherSubjectAssignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/marks/my-subjects?academicYearId=&classLevelId=&sectionId=
 * For Teachers: returns the subjects they are assigned to
 * For Admins: returns all subjects matching filters
 */
export const getMySubjects = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId } = req.query;
    if (req.user.role === "Admin") {
      // Admin sees everything
      const filter = {};
      if (classLevelId) filter.classLevelId = classLevelId;
      if (academicYearId) filter.academicYearId = academicYearId;
      const subjects = await Subject.find(filter)
        .populate("classLevelId", "name")
        .populate("academicYearId", "name");
      return res.json(subjects);
    }

    // Teacher – find their assignments
    const asgnFilter = { teacherId: req.user._id };
    if (academicYearId) asgnFilter.academicYearId = academicYearId;
    if (classLevelId)   asgnFilter.classLevelId   = classLevelId;
    if (sectionId)      asgnFilter.sectionId       = sectionId;

    const assignments = await TeacherSubjectAssignment.find(asgnFilter)
      .populate("subjectId", "name code");

    const subjects = assignments.map(a => a.subjectId).filter(Boolean);
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── MARKS ENTRY ───────────────────────────────────────────────────────────────

/**
 * GET /api/marks/students?academicYearId=&classLevelId=&sectionId=
 * Returns enrolled students for a class/section/year
 */
export const getStudentsForMarks = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId } = req.query;
    if (!academicYearId || !classLevelId || !sectionId)
      return res.status(400).json({ message: "academicYearId, classLevelId, sectionId required" });

    const students = await Student.find({ academicYearId, classLevelId, sectionId, status: "active" })
      .select("firstName lastName emisNumber rollNumber")
      .sort({ firstName: 1 });

    res.json(students);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/marks?academicYearId=&classLevelId=&sectionId=&subjectId=&examTypeCode=
 * Returns existing marks for a given filter (for pre-filling the form)
 */
export const getMarks = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId, subjectId, examTypeCode } = req.query;
    const filter = {};
    if (academicYearId) filter.academicYearId = academicYearId;
    if (classLevelId)   filter.classLevelId   = classLevelId;
    if (sectionId)      filter.sectionId       = sectionId;
    if (subjectId)      filter.subjectId       = subjectId;
    if (examTypeCode)   filter.examTypeCode    = examTypeCode;

    // Authorization: teachers can only view marks for subjects they teach
    if (req.user.role === "Teacher") {
      const asgnFilter = { teacherId: req.user._id };
      if (subjectId)      asgnFilter.subjectId      = subjectId;
      if (classLevelId)   asgnFilter.classLevelId   = classLevelId;
      if (sectionId)      asgnFilter.sectionId       = sectionId;
      if (academicYearId) asgnFilter.academicYearId = academicYearId;

      const assignmentCount = await TeacherSubjectAssignment.countDocuments(asgnFilter);
      if (subjectId && assignmentCount === 0) {
        return res.status(403).json({ message: "You are not assigned to this subject" });
      }
    }

    const marks = await MarksRecord.find(filter)
      .populate("studentId", "firstName lastName emisNumber")
      .populate("subjectId", "name code")
      .populate("enteredBy", "name")
      .populate("updatedBy", "name");

    res.json(marks);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * POST /api/marks/bulk-save
 * Body: { academicYearId, classLevelId, sectionId, subjectId, examTypeCode, entries: [{studentId, marks}] }
 */
export const bulkSaveMarks = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId, subjectId, examTypeCode, entries } = req.body;
    if (!academicYearId || !classLevelId || !sectionId || !subjectId || !examTypeCode || !Array.isArray(entries)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check teacher authorization
    if (req.user.role === "Teacher") {
      const asgn = await TeacherSubjectAssignment.findOne({
        teacherId: req.user._id,
        subjectId,
        classLevelId
      });
      if (!asgn) return res.status(403).json({ message: "Not assigned to this subject/class" });
    }

    // Validate marks against exam type max
    const examType = await ExamType.findOne({ code: examTypeCode });
    if (!examType) return res.status(404).json({ message: "Exam type not found" });
    if (!examType.isEnabled) return res.status(400).json({ message: "This exam type is disabled" });

    const results = [];
    for (const entry of entries) {
      const { studentId, marks } = entry;
      if (marks === undefined || marks === null || marks === "") continue; // skip blank
      const numMarks = Number(marks);
      if (isNaN(numMarks) || numMarks < 0 || numMarks > examType.maxMarks) {
        return res.status(400).json({
          message: `Invalid marks ${marks} for student ${studentId}. Max is ${examType.maxMarks}`
        });
      }

      // Check if record exists
      const existing = await MarksRecord.findOne({
        studentId, subjectId, academicYearId, examTypeCode
      });

      if (existing) {
        // Log the edit
        if (existing.marks !== numMarks) {
          await MarksEditLog.create({
            marksRecordId: existing._id,
            oldMarks: existing.marks,
            newMarks: numMarks,
            changedBy: req.user._id,
            changedAt: new Date()
          });
          existing.marks = numMarks;
          existing.updatedBy = req.user._id;
          await existing.save();
        }
        results.push(existing);
      } else {
        // Create new
        const record = await MarksRecord.create({
          academicYearId, classLevelId, sectionId,
          subjectId, studentId, examTypeCode,
          marks: numMarks,
          enteredBy: req.user._id
        });
        results.push(record);
      }
    }

    res.json({ message: "Marks saved successfully", count: results.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** GET /api/marks/edit-logs/:marksRecordId */
export const getEditLogs = async (req, res) => {
  try {
    const logs = await MarksEditLog.find({ marksRecordId: req.params.marksRecordId })
      .populate("changedBy", "name")
      .sort({ changedAt: -1 });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── SUBJECT TOTALS ────────────────────────────────────────────────────────────

/**
 * GET /api/marks/subject-totals?academicYearId=&classLevelId=&sectionId=
 * Returns totals per student per subject (each subject out of 100)
 */
export const getSubjectTotals = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId } = req.query;
    if (!academicYearId || !classLevelId || !sectionId)
      return res.status(400).json({ message: "academicYearId, classLevelId, sectionId required" });

    // Get all marks for this class/section/year
    const allMarks = await MarksRecord.find({ academicYearId, classLevelId, sectionId })
      .populate("studentId", "firstName lastName emisNumber")
      .populate("subjectId", "name code");

    const examTypes = await ExamType.find({ isEnabled: true }).sort({ order: 1 });

    // Build: studentId -> subjectId -> { [examTypeCode]: marks }
    const map = {};
    for (const m of allMarks) {
      const sid = String(m.studentId?._id || m.studentId);
      const subid = String(m.subjectId?._id || m.subjectId);
      if (!map[sid]) map[sid] = { student: m.studentId, subjects: {} };
      if (!map[sid].subjects[subid]) map[sid].subjects[subid] = { subject: m.subjectId, marks: {} };
      map[sid].subjects[subid].marks[m.examTypeCode] = m.marks;
    }

    // Build result
    const result = Object.values(map).map(({ student, subjects }) => {
      const subjectTotals = Object.values(subjects).map(({ subject, marks }) => {
        const total = examTypes.reduce((sum, et) => sum + (marks[et.code] ?? 0), 0);
        const hasAllMarks = examTypes.every(et => marks[et.code] !== undefined);
        return {
          subject,
          marks,
          total,
          isComplete: hasAllMarks,
          maxTotal: 100
        };
      });
      const overallTotal = subjectTotals.reduce((sum, s) => sum + s.total, 0);
      const numSubjects = subjectTotals.length;
      return {
        student,
        subjectTotals,
        overallTotal,
        averageScore: numSubjects ? Math.round((overallTotal / numSubjects) * 100) / 100 : 0
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── RANKINGS ──────────────────────────────────────────────────────────────────

/**
 * POST /api/marks/generate-rankings
 * Body: { academicYearId, classLevelId, sectionId }
 * Computes and saves rankings for the given class/section/year.
 * Tie-breaking: Option B (final total → midterm total → alphabetical)
 */
export const generateRankings = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId } = req.body;
    if (!academicYearId || !classLevelId || !sectionId)
      return res.status(400).json({ message: "academicYearId, classLevelId, sectionId required" });

    const allMarks = await MarksRecord.find({ academicYearId, classLevelId, sectionId })
      .populate("studentId", "firstName lastName");

    const examTypes = await ExamType.find({ isEnabled: true }).sort({ order: 1 });

    // Build per-student scores
    const studentMap = {};
    for (const m of allMarks) {
      const sid = String(m.studentId?._id || m.studentId);
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: m.studentId,
          subjectTotals: {},
          examTypeTotals: {}
        };
        for (const et of examTypes) studentMap[sid].examTypeTotals[et.code] = 0;
      }
      const subid = String(m.subjectId);
      if (!studentMap[sid].subjectTotals[subid]) studentMap[sid].subjectTotals[subid] = 0;
      studentMap[sid].subjectTotals[subid] += m.marks;
      studentMap[sid].examTypeTotals[m.examTypeCode] = (studentMap[sid].examTypeTotals[m.examTypeCode] || 0) + m.marks;
    }

    const students = Object.values(studentMap).map(s => {
      const totalScore = Object.values(s.subjectTotals).reduce((a, b) => a + b, 0);
      const numSubjects = Object.keys(s.subjectTotals).length;
      const averageScore = numSubjects ? Math.round((totalScore / numSubjects) * 100) / 100 : 0;
      return {
        studentId: s.studentId,
        totalScore,
        averageScore,
        finalTotal:   s.examTypeTotals["final"]   || 0,
        midtermTotal: s.examTypeTotals["midterm"]  || 0,
        name: `${s.studentId?.firstName || ""} ${s.studentId?.lastName || ""}`.trim()
      };
    });

    // Sort: by totalScore desc, then finalTotal desc, then midtermTotal desc, then name asc
    students.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.finalTotal !== a.finalTotal) return b.finalTotal - a.finalTotal;
      if (b.midtermTotal !== a.midtermTotal) return b.midtermTotal - a.midtermTotal;
      return a.name.localeCompare(b.name);
    });

    // Assign positions (competition ranking: same score → same position)
    let position = 1;
    for (let i = 0; i < students.length; i++) {
      if (i > 0 && students[i].totalScore !== students[i - 1].totalScore) {
        position = i + 1;
      }
      students[i].position = position;
    }

    // Save/update rank records
    const ranked = [];
    for (const s of students) {
      const doc = await RankRecord.findOneAndUpdate(
        { academicYearId, classLevelId, sectionId, studentId: s.studentId?._id || s.studentId },
        {
          totalScore: s.totalScore,
          averageScore: s.averageScore,
          position: s.position,
          generatedAt: new Date(),
          generatedBy: req.user._id
        },
        { upsert: true, new: true }
      );
      ranked.push({ ...doc.toObject(), studentName: s.name });
    }

    res.json({ message: "Rankings generated", rankings: ranked });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/marks/rankings?academicYearId=&classLevelId=&sectionId=
 */
export const getRankings = async (req, res) => {
  try {
    const { academicYearId, classLevelId, sectionId } = req.query;
    const filter = {};
    if (academicYearId) filter.academicYearId = academicYearId;
    if (classLevelId)   filter.classLevelId   = classLevelId;
    if (sectionId)      filter.sectionId       = sectionId;

    const rankings = await RankRecord.find(filter)
      .populate("studentId",      "firstName lastName emisNumber")
      .populate("classLevelId",   "name")
      .populate("sectionId",      "name")
      .populate("academicYearId", "name")
      .populate("generatedBy",    "name")
      .sort({ position: 1 });

    res.json(rankings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── REPORT CARD ───────────────────────────────────────────────────────────────

/**
 * GET /api/marks/report-card/:studentId?academicYearId=
 * Returns full marks breakdown for a student across all subjects & exam types
 */
export const getReportCard = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    const filter = { studentId };
    if (academicYearId) filter.academicYearId = academicYearId;

    const marks = await MarksRecord.find(filter)
      .populate("subjectId",      "name code")
      .populate("academicYearId", "name")
      .populate("classLevelId",   "name")
      .populate("sectionId",      "name");

    const examTypes = await ExamType.find({ isEnabled: true }).sort({ order: 1 });

    // Group by subject
    const subjectMap = {};
    for (const m of marks) {
      const subid = String(m.subjectId?._id || m.subjectId);
      if (!subjectMap[subid]) {
        subjectMap[subid] = { subject: m.subjectId, examMarks: {} };
      }
      subjectMap[subid].examMarks[m.examTypeCode] = m.marks;
    }

    const subjects = Object.values(subjectMap).map(({ subject, examMarks }) => {
      const total = examTypes.reduce((s, et) => s + (examMarks[et.code] ?? 0), 0);
      return { subject, examMarks, total, maxTotal: 100 };
    });

    const overallTotal = subjects.reduce((s, sub) => s + sub.total, 0);
    const numSubjects  = subjects.length;
    const average      = numSubjects ? Math.round((overallTotal / numSubjects) * 100) / 100 : 0;

    // Get rank if available
    let rankRecord = null;
    if (academicYearId && marks.length > 0) {
      const first = marks[0];
      rankRecord = await RankRecord.findOne({
        academicYearId,
        classLevelId: first.classLevelId?._id || first.classLevelId,
        sectionId:    first.sectionId?._id    || first.sectionId,
        studentId
      });
    }

    res.json({ subjects, overallTotal, average, examTypes, rankRecord });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
