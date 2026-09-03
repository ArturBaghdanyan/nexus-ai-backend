import { Router } from "express";
import { AnalyzeController } from "../analyze/analyze.controller.js";
import { HistoryController } from "../history/history.controller.js";

export const ApiGateWay = () => {
  const router = Router();

  router.use("/generate", AnalyzeController());
  router.use("/history", HistoryController());

  return router;
};
