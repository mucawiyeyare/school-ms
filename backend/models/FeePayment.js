import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
  {
    feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "mobile_money", "cheque", "other"],
      default: "cash"
    },
    receiptNo: { type: String, trim: true },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid"
    },
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("FeePayment", feePaymentSchema);
