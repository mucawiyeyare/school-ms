import User from "../models/User.js";
import Subject from "../models/Subject.js";
import bcrypt from "bcrypt";

// Get all teachers
export const listTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "Teacher" }).select("-passwordHash").sort({ createdAt: -1 });

    // For each teacher, also fetch the subjects they teach
    const teacherIds = teachers.map(t => t._id);
    const subjects = await Subject.find({ teacherUserId: { $in: teacherIds } })
      .populate("classLevelId", "name");

    const teachersWithSubjects = teachers.map(t => {
      const obj = t.toObject();
      obj.subjects = subjects.filter(s => String(s.teacherUserId) === String(t._id));
      return obj;
    });

    res.json(teachersWithSubjects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
  }
};

// Register new teacher
export const createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, status } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newTeacher = await User.create({
      name, email: email.toLowerCase(), passwordHash, phone, status, role: "Teacher"
    });

    const teacher = newTeacher.toObject();
    delete teacher.passwordHash;
    res.status(201).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Failed to create teacher", error: error.message });
  }
};

// Update teacher
export const updateTeacher = async (req, res) => {
  try {
    const { name, phone, status, password } = req.body;
    const updateData = { name, phone, status };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Teacher" },
      updateData,
      { new: true }
    ).select("-passwordHash");

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Failed to update teacher", error: error.message });
  }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: "Teacher" });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Unassign subjects from this teacher
    await Subject.updateMany({ teacherUserId: teacher._id }, { $unset: { teacherUserId: 1 } });

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete teacher", error: error.message });
  }
};

// Assign subjects to a teacher
export const assignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body; // Array of subject _ids
    if (!Array.isArray(subjectIds)) return res.status(400).json({ message: "subjectIds must be an array" });

    // 1. Unassign the teacher from any subjects they currently teach, UNLESS it's in the new list
    await Subject.updateMany(
      { teacherUserId: req.params.id, _id: { $nin: subjectIds } },
      { $unset: { teacherUserId: 1 } }
    );

    // 2. Assign the new subjects to this teacher
    if (subjectIds.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { $set: { teacherUserId: req.params.id } }
      );
    }

    res.json({ message: "Subjects assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign subjects", error: error.message });
  }
};
