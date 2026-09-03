import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const RELEVANT_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx",
  ".dart", ".py", ".go", ".rb",
  ".java", ".kt", ".swift",
  "package.json", "pubspec.yaml", "requirements.txt",
];

const EXCLUDED_PATTERNS = [
  "node_modules/", "dist/", "build/", ".next/",
  "vendor/", ".git/", "coverage/", "assets/",
  ".lock", ".svg", ".png", ".jpg", ".jpeg",
  "test/", "__tests__/", ".test.", ".spec.",
];

const MAX_FILES = 12;
const MAX_CHARS_PER_FILE = 3000;
const MAX_TOTAL_CHARS = 20000;

const isRelevantFile = (path) => {
  const lower = path.toLowerCase();
  if (EXCLUDED_PATTERNS.some((p) => lower.includes(p))) return false;
  return RELEVANT_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

export const fetchRepoContext = async (owner, repo) => {
  // 1. Metadata + default branch
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  let lastCommitDate = null;
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: defaultBranch,
      per_page: 1,
    });
    lastCommitDate = commits[0]?.commit?.author?.date ?? null;
  } catch {
    // repo might be empty or inaccessible; we can ignore this error
  }

  const { data: tree } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: "true",
  });

  const candidatePaths = (tree.tree ?? [])
    .filter((item) => item.type === "blob" && item.path && isRelevantFile(item.path))
    .slice(0, MAX_FILES * 2)
    .map((item) => item.path);

  const files = [];
  let totalChars = 0;
  let truncated = false;

  for (const path of candidatePaths) {
    if (files.length >= MAX_FILES || totalChars >= MAX_TOTAL_CHARS) {
      truncated = true;
      break;
    }

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: defaultBranch,
      });

      if (Array.isArray(fileData) || fileData.type !== "file" || !fileData.content) {
        continue;
      }

      let content = Buffer.from(fileData.content, "base64").toString("utf-8");

      if (content.length > MAX_CHARS_PER_FILE) {
        content = content.slice(0, MAX_CHARS_PER_FILE) + "\n... (truncated)";
        truncated = true;
      }

      files.push({ path, content });
      totalChars += content.length;
    } catch {
      continue;
    }
  }

  return {
    defaultBranch,
    stars: repoData.stargazers_count,
    lastCommitDate,
    files,
    truncated,
  };
};