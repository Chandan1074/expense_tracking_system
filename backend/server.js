import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/ai.js";

dotenv.config();

console.log("Gemini Key:", process.env.GEMINI_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
    res.send("AI Backend Running 🚀");
});

export default app;