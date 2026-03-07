import Section from "../models/Section.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createSection = asyncHandler(async (req, res) => {
  const { name, classLevelId } = req.body || {};
  if (!name || !classLevelId) return res.status(400).json({ message: "name and classLevelId required" });

  const created = await Section.create({ name, classLevelId });
  res.status(201).json(created);
});

export const listSections = asyncHandler(async (req, res) => {
  const { classLevelId } = req.query;
  const filter = classLevelId ? { classLevelId } : {};
  const sections = await Section.find(filter).sort({ name: 1 }).populate("classLevelId");
  res.json(sections);
});

export const updateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, classLevelId } = req.body || {};
  if (!name || !classLevelId) return res.status(400).json({ message: "name and classLevelId required" });

  const updated = await Section.findByIdAndUpdate(
    id,
    { name, classLevelId },
    { new: true, runValidators: true }
  ).populate("classLevelId");
  if (!updated) return res.status(404).json({ message: "Section not found" });
  res.json(updated);
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const section = await Section.findById(id);
  if (!section) return res.status(404).json({ message: "Section not found" });
  await section.deleteOne();
  res.json({ message: "Section deleted" });
});
