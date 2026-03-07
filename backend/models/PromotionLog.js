import mongoose from "mongoose";

const promotionLogSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    fromAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    toAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    fromClassLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel", required: true },
    toClassLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel" },
    action: { type: String, enum: ["promoted", "repeated", "transferred", "graduated"], required: true },
    reason: { type: String, trim: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("PromotionLog", promotionLogSchema);