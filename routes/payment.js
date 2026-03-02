import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { lang, ...bodyData } = req.body;

    lang = (lang || "EN").toUpperCase();

    console.log("Incoming request body:", JSON.stringify(req.body, null, 2));

    const outgoingBody = {
      ...bodyData,
      tranCur: "MNT",
      paidLimit: 1,
    };
    {
      /*} console.log(
      "Outgoing request body:",
      JSON.stringify(outgoingBody, null, 2),
    );*/
    }

    const headers = {
      APIKEY: process.env.API_KEY,
      "Content-Type": "application/json",
      LANG: lang,
    };

    const response = await axios.post(process.env.PAYMENT_URL, outgoingBody, {
      headers,
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Payment API error:",
      JSON.stringify(error.response?.data || error.message, null, 2),
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

export default router;
