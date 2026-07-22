import { Router } from "express";
import {
  createChat,
  getChats,
  getChatMessages,
  renameChat,
  deleteChat,
  streamMessage,
} from "../controllers/chatController";
import { authenticateJWT } from "../middleware/auth";
import { apiRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.use(authenticateJWT);

router.post("/", apiRateLimiter, createChat);
router.get("/", getChats);
router.get("/:chatId/messages", getChatMessages);
router.patch("/:chatId", renameChat);
router.delete("/:chatId", deleteChat);
router.post("/:chatId/stream", streamMessage);

export default router;
