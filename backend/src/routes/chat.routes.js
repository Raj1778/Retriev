import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getUserChats } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/chats", authMiddleware, getUserChats);

export default router;

