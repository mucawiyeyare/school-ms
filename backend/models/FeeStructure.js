import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Tuition Fee", "Transport"
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    classLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel" }, // null means all classes
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("FeeStructure", feeStructureSchema);
