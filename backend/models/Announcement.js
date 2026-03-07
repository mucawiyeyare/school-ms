import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal"
    },
    targetRoles: {
      type: [String],
      enum: ["Admin", "Teacher", "Student", "Parent", "All"],
      default: ["All"]
    },
    targetClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel" }],
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
