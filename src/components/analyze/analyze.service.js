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
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert code reviewer. Analyze the provided repository files or code in ${validatedData.language}.

        Respond ONLY with a valid JSON object, no markdown fences, no extra text, in this exact shape:
        {
        "score": <integer 0-100, based strictly on code quality, structure, security, and best practices actually observed>,
        "summary": "<1-2 sentence overall summary>",
        "result": "<full markdown-formatted detailed review>"
        }

        Base the score ONLY on what is actually shown to you. If information is missing (e.g. no test files were found), reflect that in a lower score and mention it explicitly rather than guessing or defaulting.`,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const rawContent = aiResponse.choices[0].message.content;

    let parsed;
    try {
      const cleaned = rawContent.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", rawContent);
      parsed = {
        score: null,
        summary: "",
        result: rawContent,
      };
    }

    const createHistoryData = HistoryDto({
      anonId: createData.anonId,
      mode: createData.mode,
      prompt: createData.prompt,
      language: createData.language,
      owner,
      name,
      result: parsed.result,
      summary: parsed.summary,
      score: parsed.score ?? null,
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
