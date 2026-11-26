import Student from "../models/Student.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Result from "../models/Result.js";
import MarksRecord from "../models/MarksRecord.js";
import RankRecord from "../models/RankRecord.js";
import ExamType from "../models/ExamType.js";
import FeePayment from "../models/FeePayment.js";
import FeeStructure from "../models/FeeStructure.js";
import Enrollment from "../models/Enrollment.js";
import PromotionLog from "../models/PromotionLog.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";

export const createStudent = asyncHandler(async (req, res) => {
  const { 
    email, password, 
    firstName, lastName, gender, dateOfBirth, 
    admissionDate, status, phone, address,
    emisNumber,
    guardianName, guardianPhone, emergencyContactName, emergencyContactPhone,
    academicYearId, classLevelId, sectionId
  } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Student account email and password are required" });
  }

  if (!firstName || !lastName || !gender) {
    return res.status(400).json({ message: "First Name, Last Name, and Gender are required" });
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) return res.status(400).json({ message: "Email already exists" });

  // Check EMIS number uniqueness if provided
  if (emisNumber && emisNumber.trim()) {
    const existingEmis = await Student.findOne({ emisNumber: emisNumber.trim() });
    if (existingEmis) return res.status(400).json({ message: "EMIS number already in use" });
  }

  // Photo path from multer (if uploaded)
  const photoPath = req.file ? `/uploads/students/${req.file.filename}` : undefined;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: `${firstName} ${lastName}`.trim(),
    email,
    passwordHash,
    role: "Student",
    phone: phone || undefined
  });

  try {
    const student = await Student.create({
      studentUserId: user._id,
      emisNumber: emisNumber?.trim() || undefined,
      firstName,
      lastName,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      admissionDate: admissionDate || undefined,
      status: status || "active",
      phone: phone || undefined,
      address: address || undefined,
      photo: photoPath,
      guardianName: guardianName || undefined,
      guardianPhone: guardianPhone || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      academicYearId: academicYearId || undefined,
      classLevelId: classLevelId || undefined,
      sectionId: sectionId || undefined,
    });

    if (academicYearId && classLevelId && sectionId) {
      await Enrollment.create({
        studentId: student._id,
        academicYearId,
        classLevelId,
        sectionId,
        status: status || "active"
      });
    }

    res.status(201).json(student);
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

export const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
  const q = (req.query.q || "").toString().trim();
  const { classLevelId, sectionId, academicYearId, status } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { rollNumber: { $regex: q, $options: "i" } },
    ];
  }
  if (classLevelId) filter.classLevelId = classLevelId;
  if (sectionId) filter.sectionId = sectionId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (status) filter.status = status;

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    if (allowedClassIds.length === 0) {
      return res.json({ items: [], page, limit, total: 0, pages: 0 });
    }

    if (filter.classLevelId) {
      if (!allowedClassIds.includes(filter.classLevelId.toString())) {
        return res.status(403).json({ message: "Not authorized to view students in this class" });
      }
    } else {
      filter.classLevelId = { $in: allowedClassIds };
    }
  }

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate("academicYearId", "name status")
      .populate("classLevelId", "name")
      .populate("sectionId", "name")
      .populate("studentUserId", "email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter)
  ]);

  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

export const studentHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id)
    .populate("academicYearId")
    .populate("classLevelId")
    .populate("sectionId");
    
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ student });
});

// ── Self-service (Student role only) ─────────────────────────────────────────

export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ studentUserId: req.user._id })
    .populate("academicYearId", "name status startDate endDate")
    .populate("classLevelId", "name orderNumber")
    .populate("sectionId", "name");

  if (!student) return res.status(404).json({ message: "Student profile not found" });

  const sid = student._id;

  // Fetch all related data in parallel
  const [results, attendanceRecords, feePayments, enrollments, promotions] = await Promise.all([
    // Exam results (now using MarksRecord)
    MarksRecord.find({ studentId: sid })
      .populate({
        path: "subjectId",
        select: "name code classLevelId",
        populate: { path: "classLevelId", select: "name" }
      })
      .populate("academicYearId", "name")
      .populate("classLevelId", "name")
      .sort({ createdAt: -1 }),

    // Attendance sheets that include this student
    Attendance.find({ "records.studentId": sid })
      .populate("academicYearId", "name")
      .populate("classLevelId", "name")
      .populate("sectionId", "name")
      .sort({ date: -1 })
      .limit(100), // last 100 sessions

    // Fee payments for this student with fee structure info
    FeePayment.find({ studentId: sid })
      .populate("feeStructureId", "name amount dueDate academicYearId")
      .sort({ paymentDate: -1 }),

    // Enrollment history
    Enrollment.find({ studentId: sid })
      .populate("academicYearId", "name status")
      .populate("classLevelId", "name orderNumber")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 }),

    // Promotion logs
    PromotionLog.find({ studentId: sid })
      .populate("fromAcademicYearId", "name")
      .populate("toAcademicYearId", "name")
      .populate("fromClassLevelId", "name")
      .populate("fromSectionId", "name")
      .populate("toClassLevelId", "name")
      .populate("toSectionId", "name")
      .sort({ createdAt: -1 })
  ]);

  // Build attendance summary for this student (extract per-student records)
  const attendanceSummary = attendanceRecords.map(sheet => {
    const myRecord = sheet.records.find(r => r.studentId?.toString() === sid.toString());
    return {
      _id: sheet._id,
      date: sheet.date,
      period: sheet.period,
      academicYear: sheet.academicYearId,
      classLevel: sheet.classLevelId,
      section: sheet.sectionId,
      status: myRecord?.status || "absent",
      note: myRecord?.note || ""
    };
  });

  // Attendance statistics
  const total = attendanceSummary.length;
  const present = attendanceSummary.filter(a => a.status === "present").length;
  const late = attendanceSummary.filter(a => a.status === "late").length;
  const absent = attendanceSummary.filter(a => a.status === "absent").length;
  const excused = attendanceSummary.filter(a => a.status === "excused").length;
  const attendanceStats = { total, present, late, absent, excused, percentage: total > 0 ? Math.round(((present + late) / total) * 100) : null };

  // Fee summary
  const totalPaid = feePayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  res.json({
    student,
    user: { name: req.user.name, email: req.user.email, role: req.user.role },
    results,
    attendance: attendanceSummary,
    attendanceStats,
    feePayments,
    totalFeePaid: totalPaid,
    enrollments,
    promotions
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { phone, address, guardianName, guardianPhone, currentPassword, newPassword } = req.body || {};

  const student = await Student.findOne({ studentUserId: req.user._id });
  if (!student) return res.status(404).json({ message: "Student profile not found" });

  if (phone !== undefined)         student.phone = phone;
  if (address !== undefined)       student.address = address;
  if (guardianName !== undefined)  student.guardianName = guardianName;
  if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;

  let photoPath = null;
  if (req.file) {
    photoPath = `/uploads/profiles/${req.file.filename}`;
    student.photo = photoPath;
  }

  await student.save();

  const user = await User.findById(req.user._id);

  if (photoPath) {
    user.avatar = photoPath;
    await user.save();
  }

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required to change password" });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  const updated = await Student.findById(student._id)
    .populate("academicYearId", "name status")
    .populate("classLevelId", "name orderNumber")
    .populate("sectionId", "name");

  res.json({ student: updated });
});

// ── Student: get my results grouped by class/year ─────────────────────────────
export const getMyResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ studentUserId: req.user._id })
    .populate("academicYearId", "name status")
    .populate("classLevelId", "name orderNumber")
    .populate("sectionId", "name");

  if (!student) return res.status(404).json({ message: "Student profile not found" });

  const sid = student._id;

  // Fetch all marks records and enrollments together
  const [allMarks, enrollments, examTypes, rankRecords] = await Promise.all([
    MarksRecord.find({ studentId: sid })
      .populate("subjectId", "name code")
      .populate("academicYearId", "name")
      .populate("classLevelId", "name orderNumber")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 }),
    Enrollment.find({ studentId: sid })
      .populate("academicYearId", "name status")
      .populate("classLevelId", "name orderNumber")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 }),
    ExamType.find({ isEnabled: true }).sort({ order: 1 }),
    RankRecord.find({ studentId: sid })
      .populate("classLevelId", "name")
      .populate("academicYearId", "name")
  ]);

  // Build a map of classLevelId+academicYearId -> marks data
  const groupMap = {};

  for (const mark of allMarks) {
    const clsId = String(mark.classLevelId?._id || mark.classLevelId);
    const yrId  = String(mark.academicYearId?._id || mark.academicYearId);
    const secId = String(mark.sectionId?._id || mark.sectionId);
    const key   = `${clsId}__${yrId}`;

    if (!groupMap[key]) {
      groupMap[key] = {
        classLevelId: clsId,
        className: mark.classLevelId?.name || "Unknown Class",
        classOrder: mark.classLevelId?.orderNumber || 0,
        academicYearId: yrId,
        academicYearName: mark.academicYearId?.name || "Unknown Year",
        sectionId: secId,
        sectionName: mark.sectionId?.name || "",
        byExamType: {},
        subjects: {}
      };
      for (const et of examTypes) {
        groupMap[key].byExamType[et.code] = { label: et.label, maxMarks: et.maxMarks, subjects: [] };
      }
    }

    // Add to per-subject map for this class/year
    const subId = String(mark.subjectId?._id || mark.subjectId);
    if (!groupMap[key].subjects[subId]) {
      groupMap[key].subjects[subId] = { subjectId: subId, name: mark.subjectId?.name || "?", code: mark.subjectId?.code || "", examMarks: {} };
    }
    groupMap[key].subjects[subId].examMarks[mark.examTypeCode] = mark.marks;

    // Also slot into byExamType
    if (groupMap[key].byExamType[mark.examTypeCode]) {
      groupMap[key].byExamType[mark.examTypeCode].subjects.push({
        subjectId: subId,
        name: mark.subjectId?.name || "?",
        code: mark.subjectId?.code || "",
        marks: mark.marks,
        maxMarks: mark.marks !== undefined ? examTypes.find(e => e.code === mark.examTypeCode)?.maxMarks || 100 : 100
      });
    }
  }

  // Add rank records to each group
  for (const rank of rankRecords) {
    const clsId = String(rank.classLevelId?._id || rank.classLevelId);
    const yrId  = String(rank.academicYearId?._id || rank.academicYearId);
    const key   = `${clsId}__${yrId}`;
    if (groupMap[key]) {
      groupMap[key].position    = rank.position;
      groupMap[key].totalScore  = rank.totalScore;
      groupMap[key].averageScore = rank.averageScore;
    }
  }

  // Convert subjects from map to array
  const groups = Object.values(groupMap).map(g => ({
    ...g,
    subjects: Object.values(g.subjects),
    examTypes
  }));

  // Sort groups: current class first, then by orderNumber desc
  groups.sort((a, b) => {
    const isCurrent = (g) => g.classLevelId === String(student.classLevelId?._id || student.classLevelId);
    if (isCurrent(a) && !isCurrent(b)) return -1;
    if (!isCurrent(a) && isCurrent(b)) return 1;
    return (b.classOrder || 0) - (a.classOrder || 0);
  });

  res.json({
    student: {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      emisNumber: student.emisNumber,
      currentClass: student.classLevelId,
      currentSection: student.sectionId,
      currentYear: student.academicYearId
    },
    groups,
    enrollments,
    examTypes
  });
});

// ── Admin: get single student by ID ──────────────────────────────────────────
export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate("academicYearId", "name status")
    .populate("classLevelId", "name")
    .populate("sectionId", "name")
    .populate("studentUserId", "email");
  if (!student) return res.status(404).json({ message: "Student not found" });

  if (req.user.role === "Teacher") {
    const subjects = await Subject.find({ teacherUserId: req.user._id });
    const classSubjects = await ClassSubject.find({ subjectId: { $in: subjects.map(s => s._id) } });
    
    const allowedClassIds = [
      ...subjects.map(s => s.classLevelId?.toString()).filter(Boolean),
      ...classSubjects.map(cs => cs.classLevelId?.toString()).filter(Boolean)
    ];

    if (!allowedClassIds.includes(student.classLevelId?.toString())) {
      return res.status(403).json({ message: "Not authorized to view this student profile" });
    }
  }

  const sid = student._id;
  const [results, attendanceRecords, feePayments, enrollments, promotions] = await Promise.all([
    MarksRecord.find({ studentId: sid })
      .populate({ path: "subjectId", select: "name code classLevelId", populate: { path: "classLevelId", select: "name" } })
      .populate("academicYearId", "name")
      .populate("classLevelId", "name")
      .sort({ createdAt: -1 }),
    Attendance.find({ "records.studentId": sid })
      .populate("classLevelId", "name")
      .populate("sectionId", "name")
      .sort({ date: -1 }).limit(100),
    FeePayment.find({ studentId: sid })
      .populate("feeStructureId", "name amount dueDate")
      .sort({ paymentDate: -1 }),
    Enrollment.find({ studentId: sid })
      .populate("academicYearId", "name status")
      .populate("classLevelId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 }),
    PromotionLog.find({ studentId: sid })
      .populate("fromAcademicYearId", "name")
      .populate("toAcademicYearId", "name")
      .populate("fromClassLevelId", "name")
      .populate("fromSectionId", "name")
      .populate("toClassLevelId", "name")
      .populate("toSectionId", "name")
      .sort({ createdAt: -1 })
  ]);

  const attendanceSummary = attendanceRecords.map(sheet => {
    const myRecord = sheet.records.find(r => r.studentId?.toString() === sid.toString());
    return { _id: sheet._id, date: sheet.date, period: sheet.period, classLevel: sheet.classLevelId, section: sheet.sectionId, status: myRecord?.status || "absent", note: myRecord?.note || "" };
  });
  const total = attendanceSummary.length;
  const present = attendanceSummary.filter(a => a.status === "present").length;
  const late    = attendanceSummary.filter(a => a.status === "late").length;
  const absent  = attendanceSummary.filter(a => a.status === "absent").length;
  const excused = attendanceSummary.filter(a => a.status === "excused").length;
  const attendanceStats = { total, present, late, absent, excused, percentage: total > 0 ? Math.round(((present + late) / total) * 100) : null };
  const totalFeePaid = feePayments.reduce((s, p) => s + (p.amountPaid || 0), 0);

  res.json({ student, results, attendance: attendanceSummary, attendanceStats, feePayments, totalFeePaid, enrollments, promotions });
});

// ── Admin: update any student ─────────────────────────────────────────────────
export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const fields = [
    "firstName","lastName","gender","dateOfBirth","admissionDate","status",
    "phone","address","emisNumber",
    "guardianName","guardianPhone","emergencyContactName","emergencyContactPhone",
    "academicYearId","classLevelId","sectionId"
  ];
  fields.forEach(f => { if (req.body[f] !== undefined) student[f] = req.body[f] || undefined; });

  // Check EMIS uniqueness if changed
  if (req.body.emisNumber && req.body.emisNumber.trim()) {
    const dup = await Student.findOne({ emisNumber: req.body.emisNumber.trim(), _id: { $ne: student._id } });
    if (dup) return res.status(400).json({ message: "EMIS number already in use by another student" });
    student.emisNumber = req.body.emisNumber.trim();
  }

  await student.save();

  // Also update the User's name if first/last name changed
  if (req.body.firstName || req.body.lastName) {
    await User.findByIdAndUpdate(student.studentUserId, {
      name: `${student.firstName} ${student.lastName}`.trim()
    });
  }

  // Keep Enrollment in sync with the student's current placement
  if (student.academicYearId && student.classLevelId && student.sectionId) {
    await Enrollment.findOneAndUpdate(
      { studentId: student._id, academicYearId: student.academicYearId },
      { classLevelId: student.classLevelId, sectionId: student.sectionId, status: student.status === "active" ? "active" : student.status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const updated = await Student.findById(student._id)
    .populate("academicYearId", "name status")
    .populate("classLevelId", "name")
    .populate("sectionId", "name")
    .populate("studentUserId", "email");

  res.json(updated);
});

// ── Admin: delete a student ───────────────────────────────────────────────────
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  // Delete related data
  await Promise.all([
    Result.deleteMany({ studentId: student._id }),
    MarksRecord.deleteMany({ studentId: student._id }),
    FeePayment.deleteMany({ studentId: student._id }),
    Enrollment.deleteMany({ studentId: student._id }),
    PromotionLog.deleteMany({ studentId: student._id }),
  ]);

  // Delete the login user account
  await User.findByIdAndDelete(student.studentUserId);
  await Student.findByIdAndDelete(student._id);

  res.json({ message: "Student and all associated data deleted successfully" });
});

