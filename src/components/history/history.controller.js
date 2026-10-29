import { Router } from "express";
import { HistoryService } from "./history.service.js";

export const HistoryController = () => {
  const router = Router();

  const { createHistory, getHistory } = HistoryService();

  router.post("/", async (req, res) => {
    try {
      const { mode, prompt, language, score, summary, name, result } = req.body;

      const historyData = {
        anonId: req.anonId,
        mode,
        prompt,
        language,
        name,
        result,
        score,
        summary,
        owner: req.anonId,
      };

      const newHistory = await createHistory(historyData);

      return res.status(200).json({
        success: true,
        data: newHistory, 
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const historyList = await getHistory([
        req.anonId,
        req.legacyAnonId,
      ]);

      return res.status(200).json({
        success: true,
        data: historyList,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  });

  return router;
};
