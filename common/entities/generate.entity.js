import mongoose, { Schema } from "mongoose";

const generateEntity = new Schema({
  owner: {
    type: String,
    required: function () {
      return this.mode === "url";
    },
  },
  name: {
    type: String,
    required: function () {
      return this.mode === "url";
    },
  },
  prompt: {
    type: String,
    required: true,
  },
  language: {
    type: String,
  },
  mode: {
    type: String,
    required: true,
  },
  result: { type: String, required: true },
});

const GenerateData = mongoose.model("GenerateData", generateEntity);
export default GenerateData;
