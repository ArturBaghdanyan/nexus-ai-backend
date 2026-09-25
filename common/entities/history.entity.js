import mongoose, { Schema } from "mongoose";

const historySchema = new Schema(
  {
    anonId: { 
      type: String, 
      index: true 
    },
    mode: {
      type: String,
      enum: ["url", "code"],
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    language: {
      type: String,
    },
    owner: {
      type: String,
      index: true, // index ավելացրեք արագ GET-ի համար
    },
    name: {
      type: String,
    },
    result: {
      type: String,
    },
    summary: {
      type: String,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);

const History = mongoose.model("History", historySchema);
export default History;