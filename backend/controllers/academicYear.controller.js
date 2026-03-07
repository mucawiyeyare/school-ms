import AcademicYear from "../models/AcademicYear.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createAcademicYear = asyncHandler(async (req, res) => {
  const { name, startDate, endDate } = req.body || {};
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: "name, startDate, endDate required" });
  }
  const year = await AcademicYear.create({ name, startDate, endDate, status: "archived" });
  res.status(201).json(year);
});

export const listAcademicYears = asyncHandler(async (req, res) => {
  const years = await AcademicYear.find().sort({ startDate: -1 });
  res.json(years);
});

export const activateAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const year = await AcademicYear.findById(id);
  if (!year) return res.status(404).json({ message: "Academic year not found" });

  await AcademicYear.updateMany({ _id: { $ne: id } }, { $set: { status: "archived" } });
  year.status = "active";
  await year.save();

  res.json({ message: "Academic year activated", activeYear: year });
});

export const updateAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate } = req.body || {};
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: "name, startDate, endDate required" });
  }
  const year = await AcademicYear.findByIdAndUpdate(
    id,
    { name, startDate, endDate },
    { new: true, runValidators: true }
  );
  if (!year) return res.status(404).json({ message: "Academic year not found" });
  res.json(year);
});

export const deleteAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const year = await AcademicYear.findById(id);
  if (!year) return res.status(404).json({ message: "Academic year not found" });
  if (year.status === "active") {
    return res.status(400).json({ message: "Cannot delete the active academic year" });
  }
  await year.deleteOne();
  res.json({ message: "Academic year deleted" });
});
