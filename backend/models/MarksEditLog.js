import mongoose from "mongoose";

const marksEditLogSchema = new mongoose.Schema(
  {
    marksRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "MarksRecord", required: true },
    oldMarks:      { type: Number, required: true },
    newMarks:      { type: Number, required: true },
    changedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt:     { type: Date, default: Date.now },
    reason:        { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("MarksEditLog", marksEditLogSchema);
