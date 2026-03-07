import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present"
    },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    classLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    date: { type: Date, required: true },
    period: { type: String, trim: true, default: "Morning" },
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    records: [attendanceRecordSchema]
  },
  { timestamps: true }
);

attendanceSchema.index({ classLevelId: 1, sectionId: 1, date: 1, period: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
