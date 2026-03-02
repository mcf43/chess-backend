import express from "express";
import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ Бүх тэмцээн авах
router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("author", "firstname lastname email phone")
      .populate("registeredUsers", "firstname lastname email phone")
      .sort({ createdAt: -1 });

    res.json(tournaments);
  } catch (err) {
    console.error("GET /tournament error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Нэг тэмцээн авах
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid tournament ID" });
    }

    const tournament = await Tournament.findById(id)
      .populate("author", "firstname lastname email phone")
      .populate("registeredUsers", "firstname lastname email phone");

    if (!tournament)
      return res.status(404).json({ msg: "Tournament not found" });

    res.json(tournament);
  } catch (err) {
    console.error("GET /tournament/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Шинэ тэмцээн үүсгэх
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      location,
      price,
      image,
      age_category,
    } = req.body;

    if (!title || !description || !startDate || !location || !price) {
      return res.status(400).json({ msg: "Required fields missing" });
    }

    const tournament = await Tournament.create({
      title,
      description,
      startDate,
      location,
      price,
      image,
      age_category,
      author: req.userId,
    });

    res.json(tournament);
  } catch (err) {
    console.error("POST /tournament error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Тэмцээнд бүртгүүлэх
router.post("/register/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid tournament ID" });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament)
      return res.status(404).json({ msg: "Tournament not found" });

    if (!tournament.registeredUsers.includes(req.userId)) {
      tournament.registeredUsers.push(req.userId);
      await tournament.save();
      return res.json({ msg: "Амжилттай бүртгэгдлээ!" });
    } else {
      return res.status(400).json({ msg: "Already registered" });
    }
  } catch (err) {
    console.error("POST /tournament/register/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
