import History from "../../../common/entities/history.entity.js";
import { HistoryDto } from "../../../common/dtos/history.dto.js";

export const HistoryService = () => {
  const createHistory = async (createData) => {
    try {
      const validatedData = HistoryDto(createData);

      const history = await History.create({
        mode: validatedData.mode,
        name: validatedData.name,
        prompt: validatedData.prompt,
        owner: validatedData.owner,
        language: validatedData.language,
        result: validatedData.result,
        score: validatedData.score ?? createData.score,
        summary: validatedData.summary ?? createData.summary,
      });

      return history;
    } catch (err) {
      throw new Error(err.message || "Error creating history in database");
    }
  };

  const getHistory = async (anonIds) => {
    try {
      const visitorIds = [...new Set(anonIds.filter(Boolean))];
      if (visitorIds.length === 0) return [];

      const historyList = await History.find({
        anonId: { $in: visitorIds },
      }).sort({ createdAt: -1 });

      return historyList;
    } catch (err) {
      throw new Error(err.message || "Error fetching history from database");
    }
  };
  return { createHistory, getHistory };
};
