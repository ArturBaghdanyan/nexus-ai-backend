export const HistoryDto = (data) => {
  const { mode, prompt, language, owner, name, result, score } = data; 

  if (!mode || !["url", "code"].includes(mode)) {
    throw new Error("Mode is required and must be either 'url' or 'code'");
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt is required and must be a valid string");
  }

  return {
    mode,
    prompt: prompt.trim(),
    language: language ? language.trim() : undefined,
    owner: owner ? owner.trim() : undefined,
    name: name ? name.trim() : undefined,
    result: result ? result.trim() : undefined,
    score: typeof score === "number" ? score : 0,
  };
};
