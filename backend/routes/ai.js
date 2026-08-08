import express from "express";
import axios from "axios";
import { supabase } from "../utils/supabaseClient.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;

    // Fetch transactions of logged-in user
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Create prompt for Gemini
    const prompt = `
You are an AI Financial Assistant.

User Transactions:
${JSON.stringify(transactions)}

User Question:
${message}

Give a short and helpful answer.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    const reply =
      response.data.candidates[0].content.parts[0].text;

    res.json({ reply });

  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

export default router;