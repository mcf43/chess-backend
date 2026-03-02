// routes/memberRequests.js
import express from "express";
import MemberRequest from "../models/MemberRequest.js";
import MemberCategory from "../models/MemberCategory.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.get("/all", verifyToken, async (req, res) => {
  try {
    const requests = await MemberRequest.find().sort({ requested_at: -1 });
    const categories = await MemberCategory.find({});

    const requestsWithName = requests.map((req) => {
      const cat = categories.find((c) => c.code === req.category_code);
      return {
        ...req._doc,
        category_name: cat ? cat.name : req.category_code,
      };
    });

    res.json(requestsWithName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});
router.get("/:playerId", verifyToken, async (req, res) => {
  try {
    const { playerId } = req.params;

    if (req.userId !== playerId) {
      return res.status(403).json({ success: false, msg: "Access denied" });
    }

    const requests = await MemberRequest.find({ player_id: playerId }).sort({
      requested_at: -1,
    });

    const categories = await MemberCategory.find({});
    const requestsWithName = requests.map((req) => {
      const cat = categories.find((c) => c.code === req.category_code);
      return {
        ...req._doc,
        category_name: cat ? cat.name : req.category_code,
      };
    });

    res.json(requestsWithName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

export default router;
