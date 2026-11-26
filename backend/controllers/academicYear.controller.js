import AcademicYear from "../models/AcademicYear.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleAutomaticPromotion } from "../utils/promotion.util.js";

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
  const newYear = await AcademicYear.findById(id);
  if (!newYear) return res.status(404).json({ message: "Academic year not found" });

  if (newYear.status === "active") {
    return res.status(400).json({ message: "Academic year is already active" });
  }

  // Find the currently active year (the one being closed/archived)
  const oldActiveYear = await AcademicYear.findOne({ status: "active", _id: { $ne: id } });

  // Update all other years to archived
  await AcademicYear.updateMany({ _id: { $ne: id } }, { $set: { status: "archived" } });
  
  // Set the new year to active
  newYear.status = "active";
  await newYear.save();

  // If there was an active year being closed, run the automatic promotion batch
  if (oldActiveYear) {
    // Run this asynchronously in the background so it doesn't block the request response
    handleAutomaticPromotion(oldActiveYear._id, newYear._id, req.user._id).catch(err => {
      console.error("[Auto Promotion Error] Background job failed:", err);
    });
  }

  res.json({ 
    message: oldActiveYear ? "Academic year activated and automatic promotion started." : "Academic year activated.", 
    activeYear: newYear 
  });
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
