import User from "../models/user.model.js";
import bcrypt from "bcrypt";
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({ email: email, password: password });

    res.status(201).json({
      message: "User created",
      email: email,
    });
  } catch (err) {
    console.log(err);
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email }).select("+password");
  const userPassword = existingUser?.password;
  const isMatch = await bcrypt.compare(password, userPassword);

  if (!existingUser || !isMatch) {
    return res.status(401).send("Invalid credentials");
  }

  res.status(200).send("Logged in Successfully");
};
