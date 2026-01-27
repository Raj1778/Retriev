import express from "express";
import dotenv from "dotenv";
import connectDb from "./src/db/db.js";
import userRouter from "./src/routes/user.routes.js";
import documentRouter from "./src/routes/document.routes.js";

dotenv.config();
connectDb();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT;
app.get("/", (req, res) => {
  res.send("Welcome to Retriev");
});
app.use("/api/upload", documentRouter);
app.use("/api/user", userRouter);
// app.use("/api/document", documentRouter);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
