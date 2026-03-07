import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};