import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ApiGateWay } from "./components/api-gateway/api-gateway.js";
import { anonIdMiddleware } from "./middlewares/anonId.middleware.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3005;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost",
  "https://nexus-review.netlify.app", 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith(".netlify.app")) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS policy violation: Origin not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(anonIdMiddleware);

app.use("/api", ApiGateWay());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
