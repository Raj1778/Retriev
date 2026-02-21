import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDb from "./src/db/db.js";
import userRouter from "./src/routes/user.routes.js";
import uploadRouter from "./src/routes/upload.routes.js";
import qaRoutes from "./src/routes/qa.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";

dotenv.config();
connectDb();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://retriev.vercel.app/"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to Retriev");
});
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.use("/api/upload", uploadRouter);
app.use("/api/user", userRouter);
app.use("/api", qaRoutes);
app.use("/api", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
