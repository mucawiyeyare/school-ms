import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // A
    classLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel", required: true }
  },
  { timestamps: true }
);

sectionSchema.index({ name: 1, classLevelId: 1 }, { unique: true });

export default mongoose.model("Section", sectionSchema);
