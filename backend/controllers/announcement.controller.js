import Announcement from "../models/Announcement.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAnnouncements = asyncHandler(async (req, res) => {
  const { targetRole, classId } = req.query;
  const filter = {};
  if (targetRole) {
    filter.$or = [{ targetRoles: "All" }, { targetRoles: targetRole }];
  }
  if (classId) {
    filter.$or = [
      ...(filter.$or || []),
      { targetClassIds: { $size: 0 } },
      { targetClassIds: classId }
    ];
  }
  const announcements = await Announcement.find(filter)
    .populate("postedBy", "name role")
    .sort({ publishedAt: -1 });
  res.json(announcements);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, priority, targetRoles, targetClassIds } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: "title, content required" });
  const ann = await Announcement.create({
    title,
    content,
    priority,
    targetRoles: targetRoles || ["All"],
    targetClassIds: targetClassIds || [],
    postedBy: req.user._id
  });
  res.status(201).json(ann);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const ann = await Announcement.findByIdAndDelete(req.params.id);
  if (!ann) return res.status(404).json({ message: "Announcement not found" });
  res.json({ message: "Announcement deleted" });
});
