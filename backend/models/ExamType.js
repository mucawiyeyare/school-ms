import mongoose from "mongoose";

const examTypeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ["monthly1", "midterm", "monthly2", "final"]
    },
    label: { type: String, required: true, trim: true },
    maxMarks: { type: Number, required: true },
    isEnabled: { type: Boolean, default: true },
    order: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("ExamType", examTypeSchema);
