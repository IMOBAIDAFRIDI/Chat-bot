import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Enable Permissive CORS for Vercel Frontend & Browser Fetch/SSE
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

// Increase JSON Body Parser Limit to 50MB for High-Def Images & PDFs
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), model: "Afridi-GPT v3.5 Pro Multimodal" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), model: "Afridi-GPT v3.5 Pro Multimodal" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);

// Global Error Handler
app.use(errorHandler);

// Always listen on PORT for Render, Docker, and standalone server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Afridi-GPT Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

export default app;
