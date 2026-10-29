import { Router } from "express";
import { generateReposity } from "./analyze.service.js";

export const AnalyzeController = () => {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { mode, prompt, language } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt (URL or code) is required",
        });
      }

      const data = await generateReposity({
        mode,
        prompt,
        language,
        anonId: req.anonId,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Analyze error:", err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
      });
    }
  });

  return router;
};
