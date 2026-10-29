import History from "../../../common/entities/history.entity.js";
import { GenerateDto } from "../../../common/dtos/generate.dto.js";
import { HistoryDto } from "../../../common/dtos/history.dto.js";
import { getGroq } from "../../lib/groq.js";
import { fetchRepoContext } from "../../lib/github.js";

const MAX_CONTEXT_CHARS = 24000; // ~6k tokens, keeps requests under Groq limits
const MAX_FILE_CHARS = 4000;

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const validate = (fn, input) => {
  try {
    return fn(input);
  } catch (err) {
    throw new AppError(err.message, 400);
  }
};

const parseGitHubRepositoryUrl = (value) => {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    throw new AppError("Enter a valid GitHub repository URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AppError("Only http(s) GitHub URLs are supported.");
  }
  if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
    throw new AppError("Only GitHub repository URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new AppError("Use the format github.com/owner/repository.");
  }

  return { owner: parts[0], name: parts[1].replace(/\.git$/i, "") };
};

const buildRepoContent = (owner, name, ctx) => {
  let total = 0;
  const blocks = [];
  let truncated = ctx.truncated;

  for (const f of ctx.files ?? []) {
    let content = String(f.content ?? "");
    if (content.length > MAX_FILE_CHARS) {
      content = content.slice(0, MAX_FILE_CHARS) + "\n...[truncated]";
      truncated = true;
    }
    const block = `--- File: ${f.path} ---\n${content}`;
    if (total + block.length > MAX_CONTEXT_CHARS) {
      truncated = true;
      break;
    }
    total += block.length;
    blocks.push(block);
  }

  return [
    `Repository: ${owner}/${name}`,
    `Default branch: ${ctx.defaultBranch}`,
    `Stars: ${ctx.stars}`,
    `Last commit: ${ctx.lastCommitDate ?? "unknown"}`,
    truncated
      ? "Note: some files were truncated or skipped due to size limits."
      : "",
    "",
    "Files:",
    blocks.join("\n\n") || "(no relevant source files found)",
  ]
    .filter(Boolean)
    .join("\n");
};

const parseAiJson = (raw) => {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const obj = JSON.parse(cleaned);
    const score = Number(obj.score);
    return {
      score: Number.isFinite(score)
        ? Math.min(100, Math.max(0, Math.round(score)))
        : null,
      summary: typeof obj.summary === "string" ? obj.summary : "",
      result:
        typeof obj.result === "string"
          ? obj.result
          : JSON.stringify(obj.result ?? obj, null, 2),
    };
  } catch {
    console.error("Failed to parse AI response as JSON:", raw);
    return { score: null, summary: "", result: raw };
  }
};

export const generateReposity = async (createData) => {
  let owner = createData.owner;
  let name = createData.name;

  if (createData.mode === "url") {
    ({ owner, name } = parseGitHubRepositoryUrl(createData.prompt));
  }

  const language = createData.language || "English";

  const validatedData = validate(GenerateDto, {
    anonId: createData.anonId,
    mode: createData.mode,
    owner,
    name,
    prompt: createData.prompt,
    language,
  });

  let userContent;
  if (validatedData.mode === "url") {
    let repoContext;
    try {
      repoContext = await fetchRepoContext(owner, name);
    } catch (err) {
      console.error("GitHub fetch failed:", err);
      if (/rate limit|quota/i.test(err.message ?? "")) {
        throw new AppError(
          "GitHub API rate limit exceeded. Try again later or configure a GitHub token.",
          429,
        );
      }
      throw new AppError(`Could not load repository: ${err.message}`, 502);
    }
    userContent = buildRepoContent(owner, name, repoContext);
  } else {
    userContent = `Review this code:\n\n${validatedData.prompt.slice(0, MAX_CONTEXT_CHARS)}`;
  }

  let aiResponse;
  try {
    aiResponse = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are an expert code reviewer. Analyze the provided repository files or code in ${validatedData.language}.

Respond ONLY with a valid JSON object, no markdown fences, no extra text, in this exact shape:
{
  "score": <integer 0-100, based strictly on code quality, structure, security, and best practices actually observed>,
  "summary": "<1-2 sentence overall summary>",
  "result": "<full markdown-formatted detailed review as a single string>"
}

Base the score ONLY on what is actually shown to you. If information is missing (e.g. no test files were found), reflect that in a lower score and mention it explicitly rather than guessing or defaulting.`,
        },
        { role: "user", content: userContent },
      ],
    });
  } catch (err) {
    console.error("Groq request failed:", err?.status, err?.message);
    if (err?.status === 429) {
      throw new AppError(
        "AI provider rate limit reached. Try again shortly.",
        429,
      );
    }
    if (err?.status === 413) {
      throw new AppError("Repository is too large to analyze.", 413);
    }
    throw new AppError(`AI provider error: ${err?.message}`, 502);
  }

  const rawContent = aiResponse.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string" || !rawContent.trim()) {
    throw new AppError("The AI provider returned an empty analysis.", 502);
  }

  const parsed = parseAiJson(rawContent);

  const createHistoryData = validate(HistoryDto, {
    anonId: createData.anonId,
    mode: createData.mode,
    prompt: createData.prompt,
    language,
    owner,
    name,
    result: parsed.result || "No analysis was returned.",
    summary: parsed.summary,
    score: parsed.score,
  });

  return History.create(createHistoryData);
};
