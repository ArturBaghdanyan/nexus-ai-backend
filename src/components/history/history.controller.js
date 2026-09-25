import { Router } from "express";
import { HistoryService } from "./history.service.js";

export const HistoryController = () => {
  const router = Router();

  const { createHistory, getHistory } = HistoryService();

  router.post("/", async (req, res) => {
    try {
      const { mode, prompt, language, score, summary, name } = req.body;

      const visitorId = req.headers["x-visitor-id"];

      if (!visitorId) {
        return res.status(400).json({
          success: false,
          error: "x-visitor-id header is missing!",
        });
      }

      const historyData = {
        mode,
        prompt,
        language,
        name: name || repoName,
        result: analysisResult,
        score,
        summary,
        owner: visitorId,
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
