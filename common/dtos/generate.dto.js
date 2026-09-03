export const GenerateDto = (data) => {
  const { anonId, mode, owner, name, prompt, language } = data;

  if (!anonId || typeof anonId !== "string") {
    throw new Error("anonId is required and must be a string");
  }

  if (!mode || typeof mode !== "string") {
    throw new Error("Mode is required and must be a string");
  }

  if (mode === "url") {
    if (!owner || typeof owner !== "string") {
      throw new Error("Owner is required for URL mode");
    }
    if (!name || typeof name !== "string") {
      throw new Error("Name is required for URL mode");
    }
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt is required and must be a string");
  }

  if (!language || typeof language !== "string") {
    throw new Error("Language is required and must be a string");
  }

  return {
    anonId: anonId.trim(),
    mode: mode.trim(),
    owner: owner ? owner.trim() : null,
    name: name ? name.trim() : null,
    prompt: prompt.trim(),
    language: language.trim(),
  };
};
