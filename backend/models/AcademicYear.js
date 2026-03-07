import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., 2024/2025
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "archived"], default: "archived" }
  },
  { timestamps: true }
);

export default mongoose.model("AcademicYear", academicYearSchema);