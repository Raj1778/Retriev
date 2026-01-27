import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  uploadPDF,
  uploadMultiplePDFs,
  deletePDF,
} from "../controllers/upload.controller.js";
import upload from "../config/multer.config.js";
const router = express.Router();

router.post("/pdf", authMiddleware, upload.single("file"), uploadPDF);

export default router;
