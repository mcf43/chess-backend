import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import svgCaptcha from "svg-captcha";
import User from "../models/User.js";
import { sendMail } from "../utils/sendMail.js";

const router = express.Router();
let captchaStore = {};

// CAPTCHA - зөвхөн login-д ашиглана
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: "#FFFFFF",
  });

  captchaStore[req.ip] = captcha.text;

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(captcha.data);
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, lname, fname, phone } = req.body;

    if (!email || !password || !lname || !fname || !phone) {
      const missing = [];
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!lname) missing.push("lname");
      if (!fname) missing.push("fname");
      if (!phone) missing.push("phone");
      console.log("Missing fields:", missing);

      return res.status(400).json({
        message: "Required fields missing",
        missingFields: missing,
      });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      email,
      password: hashed,
      lastname: lname,
      firstname: fname,
      phone,
    });

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, captcha } = req.body;

    // CAPTCHA шалгах
    if (captchaStore[req.ip] !== captcha) {
      return res.status(400).json({ message: "Captcha wrong" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Password wrong" });

    // JWT үүсгэх
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 10 * 60 * 1000,
    });

    res.json({
      isLoggedIn: true,
      user: {
        id: user._id,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", isLoggedIn: false });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Email not registered" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = code;
    user.resetExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendMail(
      email,
      "Password reset code",
      `
      <div style="font-family:Arial">
        <h2>Password Reset</h2>
        <p>Your verification code:</p>
        <h1>${code}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
      `,
    );

    res.json({ msg: "Code sent to email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, code, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (user.resetCode !== code)
    return res.status(400).json({ msg: "Invalid code" });

  if (user.resetExpire < Date.now())
    return res.status(400).json({ msg: "Code expired" });

  const hashed = await bcrypt.hash(password, 10);

  user.password = hashed;
  user.resetCode = null;
  user.resetExpire = null;

  await user.save();

  res.json({ msg: "Password updated" });
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ msg: "Logged out successfully", isLoggedIn: false });
});

export default router;
