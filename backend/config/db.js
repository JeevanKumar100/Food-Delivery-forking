import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI)   // <-- FIXED
    .then(() => console.log("DB Connected"))
    .catch((err) => {
      console.error("DB Connection Error:", err.message);
    });
};
