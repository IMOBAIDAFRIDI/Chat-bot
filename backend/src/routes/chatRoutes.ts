import { Router } from "express";
import {
  createChat,
  fetchChats,
  fetchMessages,
  renameChat,
  deleteChat,
  streamMessage,
} from "../controllers/chatController";
import { authenticateJWT } from "../middleware/auth";
import { apiRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.use(authenticateJWT);

router.post("/", apiRateLimiter, createChat);
router.get("/", fetchChats);
router.get("/:chatId/messages", fetchMessages);
router.patch("/:chatId", renameChat);
router.delete("/:chatId", deleteChat);
router.post("/:chatId/stream", streamMessage);

export default router;
