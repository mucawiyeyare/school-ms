import mongoose from "mongoose";

const examTermSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. Midterm, Final
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["upcoming", "ongoing", "completed"], default: "upcoming" }
  },
  { timestamps: true }
);

examTermSchema.index({ name: 1, academicYearId: 1 }, { unique: true });

export default mongoose.model("ExamTerm", examTermSchema);
