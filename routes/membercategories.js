import express from "express";
import MemberCategory from "../models/MemberCategory.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await MemberCategory.find({ is_active: true }).sort({
      price: 1,
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
