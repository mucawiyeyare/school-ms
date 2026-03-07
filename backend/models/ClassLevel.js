import mongoose from "mongoose";

const classLevelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Grade 1
    orderNumber: { type: Number, required: true, unique: true }
  },
  { timestamps: true }
);

export default mongoose.model("ClassLevel", classLevelSchema);