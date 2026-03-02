import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import newsRoutes from "./routes/news.js";
import uploadRoutes from "./routes/uploads.js";
import tournamentRoutes from "./routes/tournament.js";
import memberCategoryRoutes from "./routes/membercategories.js";
import memberRequestsRouter from "./routes/memberRequests.js";
import cookieParser from "cookie-parser";
import paymentRoutes from "./routes/payment.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/tournament", tournamentRoutes);
app.use("/api/membercategories", memberCategoryRoutes);
app.use("/api/member-requests", memberRequestsRouter);

app.use("/api/pay", paymentRoutes);

app.get("/", (req, res) => res.send("API OK"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("Server running on 5000"));
  })
  .catch((err) => console.log(err));
