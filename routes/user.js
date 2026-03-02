import express from "express";
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import Membership from "../models/Membership.js";
import MemberCategory from "../models/MemberCategory.js";
import MemberRequest from "../models/MemberRequest.js";

const router = express.Router();

// ---------------- Multer тохиргоо ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // uploads folder руу хадгалах
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ---------------- Routes ----------------

// /api/user/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -resetCode -resetExpire",
    );
    if (!user) return res.status(404).json({ isLoggedIn: false });

    res.json({ user, isLoggedIn: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ isLoggedIn: false });
  }
});

// /api/user/all (admin only)
router.get("/all", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const users = await User.find().select("-password -resetCode -resetExpire");
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post(
  "/upload-profile",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

      const imageUrl = `/uploads/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { image: imageUrl },
        { new: true },
      );

      res.json({ imageUrl: user.image });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  },
);
router.get("/player", async (req, res) => {
  try {
    const { type = "standart" } = req.query;

    let rankField = "";
    if (type === "standart") rankField = "rank_standart";
    else if (type === "blitz") rankField = "rank_blitz";
    else if (type === "rapid") rankField = "rank_rapid";
    else return res.status(400).json({ msg: "Invalid type" });

    const players = await User.find({
      [rankField]: { $exists: true, $ne: null, $ne: "" },
    })
      .select("-password -resetCode -resetExpire")
      // rankField-г number болгож sort хийж байна
      .sort({ [rankField]: -1 });

    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/player/top", async (req, res) => {
  try {
    const types = ["rank_standart", "rank_blitz", "rank_rapid"];
    const result = {};

    for (const type of types) {
      const players = await User.find({
        [type]: { $exists: true, $nin: [null, ""] },
      })
        .select("rank_standart rank_blitz rank_rapid firstname lastname image")
        .sort({ [type]: -1 })
        .limit(10);
      const playersWithRank = players.map((p, index) => {
        return {
          ...p.toObject(),
          rankPosition: index + 1,
        };
      });

      result[type] = playersWithRank;
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetCode -resetExpire",
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Membership-ээс шалгах
    const membership = await Membership.findOne({ player_id: user._id });
    const request_mem = membership ? membership.is_membership : false;

    res.json({ ...user.toObject(), request_mem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.post("/request-membership", verifyToken, async (req, res) => {
  try {
    const { gender, birthday, categoryCodes, fide_id } = req.body;

    if (!gender || !birthday || !categoryCodes?.length) {
      return res
        .status(400)
        .json({ success: false, msg: "Бүх талбарыг бөглөнө үү" });
    }

    const updateData = {
      gender,
      birthday,
    };

    if (fide_id && fide_id.trim() !== "") {
      updateData.fide_id = fide_id;
    }
    // Хэрэглэгч update хийх
    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    }).select("-password -resetCode -resetExpire");

    if (!user)
      return res.status(404).json({ success: false, msg: "User not found" });

    // MemberCategory validate
    const categories = await MemberCategory.find({
      code: { $in: categoryCodes },
    });
    if (!categories.length)
      return res
        .status(404)
        .json({ success: false, msg: "Category олдсонгүй" });

    const now = new Date();

    // Membership create
    const memberships = categories.map((cat) => {
      const now = new Date();
      let end_date = cat.is_lifetime ? new Date("2100-01-01") : new Date();
      if (!cat.is_lifetime)
        end_date.setMonth(end_date.getMonth() + cat.duration_month);

      return {
        player_id: user._id,
        membership_type: [cat.code],
        is_membership: true,
        status: cat.is_lifetime ? "active" : "pending",
        start_date: now,
        end_date,
      };
    });

    const created = await Membership.insertMany(memberships);

    // 🔹 MemberRequest-д хүсэлт хадгалах
    const memberRequests = categories.map((cat) => ({
      player_id: user._id,
      category_code: cat.code,
      status: "pending",
      requested_at: now,
    }));

    await MemberRequest.insertMany(memberRequests);

    res.json({ success: true, user, memberships: created, memberRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    // 🔹 Admin хэрэглэгч бол бусад user update хийж болно
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(403).json({ msg: "Access denied" });

    // 🔹 Бусад user-ийг admin өөрчилж болох, өөр user өөрийгөө өөрчилж болно
    if (currentUser.role !== "admin" && currentUserId !== id) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // 🔹 Dynamic update: frontend-аас ирсэн бүх талбар update хийнэ
    const allowedFields = [
      "firstname",
      "lastname",
      "phone",
      "email",
      "gender",
      "rank_standart",
      "rank_rapid",
      "rank_blitz",
      "pro_user",
      "referee",
      "role",
      "birthday",
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }

    // 🔹 Email, phone validation
    if (updateData.email || updateData.phone) {
      const existingUser = await User.findOne({
        $or: [{ email: updateData.email }, { phone: updateData.phone }],
        _id: { $ne: id },
      });
      if (existingUser)
        return res.status(400).json({ msg: "Ийм мэдээлэлтэй хэрэглэгч байна" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password -resetCode -resetExpire");

    if (!updatedUser) return res.status(404).json({ msg: "User not found" });

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
