import express from "express";
import News from "../models/News.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// CREATE news
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, content, image, isPublished } = req.body;
    const news = await News.create({
      title,
      content,
      image,
      isPublished,
      author: req.userId,
    });
    res.json(news);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// READ all news
router.get("/", async (req, res) => {
  try {
    const newsList = await News.find().populate(
      "author",
      "firstname lastname email",
    );
    res.json(newsList);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// READ single news
router.get("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate(
      "author",
      "firstname lastname email",
    );
    if (!news) return res.status(404).json({ msg: "News not found" });
    res.json(news);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE news
router.put("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ msg: "News not found" });

    const { title, content, image, isPublished } = req.body;
    news.title = title ?? news.title;
    news.content = content ?? news.content;
    news.image = image ?? news.image;
    news.isPublished = isPublished ?? news.isPublished;

    await news.save();
    res.json(news);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE news
router.delete("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ msg: "News not found" });

    await news.remove();
    res.json({ msg: "News deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
