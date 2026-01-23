import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected, HOST: ${conn.connection.host}`);
  } catch (err) {
    console.log("MongoDB connection error!", err.message);
    process.exit(1);
  }
};

export default connectDb;
