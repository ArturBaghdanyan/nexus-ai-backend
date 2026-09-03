import { Router } from "express";
import { HistoryService } from "./history.service.js";

export const HistoryController = () => {
  const router = Router();

  const { createHistory, getHistory } = HistoryService();

  router.post("/", async (req, res) => {
    try {
      const { mode, prompt, language, owner, name, result, score, summary } =
        req.body;

      const createHistoryData = {
        mode,
        prompt,
        language,
        owner,
        name,
        result,
        score,
      };

      const newHistory = await createHistory(createHistoryData);

      return res.status(200).json({
        success: true,
        data: newHistory,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  });
  router.get("/", async (req, res) => {
    try {
      const historyList = await getHistory();

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
