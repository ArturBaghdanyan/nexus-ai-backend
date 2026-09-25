import { Router } from "express";
import { HistoryService } from "./history.service.js";

export const HistoryController = () => {
  const router = Router();

  const { createHistory, getHistory } = HistoryService();

  router.post("/", async (req, res) => {
    try {
      const { mode, prompt, language, name, result, score, summary } =
        req.body;

      const visitorOwner = req.headers["x-visitor-id"] || req.body.owner;

      const createHistoryData = {
        mode,
        prompt,
        language,
        owner: visitorOwner,
        name,
        result,
        score,
        summary,
      };

      const newHistory = await createHistory(createHistoryData);

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
      const owner = req.headers["x-visitor-id"];
      const historyList = await getHistory(owner);

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
