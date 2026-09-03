import History from "../../../common/entities/history.entity.js";
import { GenerateDto } from "../../../common/dtos/generate.dto.js";
import { HistoryDto } from "../../../common/dtos/history.dto.js";
import { getGroq } from "../../lib/groq.js";
import { fetchRepoContext } from "../../lib/github.js";

export const generateReposity = async (createData) => {
  try {
    let owner = createData.owner;
    let name = createData.name;

    if (
      createData.mode === "url" &&
      createData.prompt &&
      (createData.prompt.includes("github.com") ||
        createData.prompt.includes("gitlab.com") ||
        createData.prompt.includes("bitbucket.com"))
    ) {
      const cleanUrl = createData.prompt.replace(/\/$/, "");
      const parts = cleanUrl.split("/");

      name = parts.pop();
      owner = parts.pop();
    }

    const validatedData = GenerateDto({
      anonId: createData.anonId,
      mode: createData.mode,
      owner,
      name,
      prompt: createData.prompt,
      language: createData.language,
    });

    let userContent;
    let repoMeta = null;

    if (validatedData.mode === "url" && owner && name) {
      const repoContext = await fetchRepoContext(owner, name);
      repoMeta = repoContext;

      const filesBlock = repoContext.files
        .map((f) => `--- File: ${f.path} ---\n${f.content}`)
        .join("\n\n");

      userContent = [
        `Repository: ${owner}/${name}`,
        `Default branch: ${repoContext.defaultBranch}`,
        `Stars: ${repoContext.stars}`,
        `Last commit: ${repoContext.lastCommitDate ?? "unknown"}`,
        repoContext.truncated
          ? "Note: some files were truncated or skipped due to size limits."
          : "",
        "",
        "Files:",
        filesBlock || "(no relevant source files found)",
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      userContent = `Review this code:\n\n${validatedData.prompt}`;
    }

    const aiResponse = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are an expert code reviewer. Analyze the provided repository files or code in ${validatedData.language} and provide structured markdown feedback based ONLY on what is actually shown to you. If information is missing (e.g. no test files were found), say so explicitly rather than guessing.`,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const aiReviewResult = aiResponse.choices[0].message.content;

    const createHistoryData = HistoryDto({
      anonId: createData.anonId,
      mode: createData.mode,
      prompt: createData.prompt,
      language: createData.language,
      owner,
      name,
      result: aiReviewResult,
      score: 85,
    });

    const history = await History.create(createHistoryData);
    return history;
  } catch (err) {
    if (
      err.message &&
      (err.message.includes("API rate limit exceeded") ||
        err.message.includes("rate limit") ||
        err.message.includes("quota exhausted"))
    ) {
      throw new Error(
        "GitHub API rate limit exceeded. Please try again later or configure a GitHub token.",
      );
    }
    throw new Error(err.message || "Error creating repository in database");
  }
};
