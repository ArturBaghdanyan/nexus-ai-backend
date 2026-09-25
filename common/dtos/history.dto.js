export const HistoryDto = (data) => {
  const {
    anonId,
    mode,
    prompt,
    language,
    owner,
    name,
    result,
    score,
    summary,
  } = data;

  const visitorIdentifier = owner || anonId;

  if (
    !visitorIdentifier ||
    typeof visitorIdentifier !== "string" ||
    visitorIdentifier.trim() === ""
  ) {
    throw new Error(
      "Owner (visitor ID) is required and must be a valid string",
    );
  }

  if (!mode || !["url", "code"].includes(mode)) {
    throw new Error("Mode is required and must be either 'url' or 'code'");
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt is required and must be a valid string");
  }

  return {
    anonId: visitorIdentifier.trim(),
    owner: visitorIdentifier.trim(),
    mode,
    prompt: prompt.trim(),
    language: language ? language.trim() : undefined,
    name: name ? name.trim() : undefined,
    result: result ? result.trim() : undefined,
    summary: summary ? summary.trim() : undefined,
    score: typeof score === "number" ? score : 0,
  };
};
