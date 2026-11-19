(function (globalScope) {
  "use strict";

  const generatedExchangeIds = new Set();
  let exchangeCounter = 0;
  let lastItemTimestamp = 0;

  function getRandomToken() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }

    exchangeCounter += 1;
    const seq = exchangeCounter.toString(36);
    const randA = Math.random().toString(36).slice(2, 10);
    const randB = Math.random().toString(36).slice(2, 10);
    return `${seq}-${randA}${randB}`;
  }

  function nextItemTimestamp() {
    const now = Date.now();
    lastItemTimestamp = now > lastItemTimestamp ? now : lastItemTimestamp + 1;
    return lastItemTimestamp;
  }


  function generateExchangeId() {
    let exchangeId;
    do {
      exchangeId = `exch-${Date.now()}-${getRandomToken()}`;
    } while (generatedExchangeIds.has(exchangeId));

    generatedExchangeIds.add(exchangeId);
    return exchangeId;
  }


  function generatePortfolioItemJson(challengeConfig, playerInfo) {
    const config =
      challengeConfig && typeof challengeConfig === "object"
        ? challengeConfig
        : (globalScope && globalScope.CHALLENGE_CONFIG) || {};
    const player =
      playerInfo && typeof playerInfo === "object" ? playerInfo : {};
    const defaultReflection =
      config.defaultReflection && typeof config.defaultReflection === "object"
        ? config.defaultReflection
        : {};

    const now = new Date();
    const customDate =
      typeof player.date === "string" ? player.date.trim() : "";
    const customEvidenceUrl =
      typeof player.customEvidenceUrl === "string"
        ? player.customEvidenceUrl.trim()
        : "";
    const defaultEvidenceUrl =
      typeof config.defaultEvidenceUrl === "string"
        ? config.defaultEvidenceUrl.trim()
        : "";

    return {
      id: "item-" + nextItemTimestamp(),
      title: config.title || "",
      type: "Challenge",
      date: customDate || now.toISOString().split("T")[0],
      role: config.role || "Participant",
      description: config.description || "",
      skills: Array.isArray(config.skills) ? [...config.skills] : [],
      reflection: {
        whatIDid: defaultReflection.whatIDid || "",
        whatILearned: defaultReflection.whatILearned || "",
        challenge: defaultReflection.challenge || "",
        nextStep: defaultReflection.nextStep || ""
      },
      evidence: [
        customEvidenceUrl ||
          defaultEvidenceUrl ||
          "https://example.com/evidence"
      ],
      challengeId: config.challengeId,
      hostGroup: config.hostGroup,
      category: config.category,
      exchangeId: generateExchangeId(),
      issuedAt: now.toISOString(),
      schemaVersion: "1.0"
    };
  }

  if (globalScope) {
    globalScope.generateExchangeId = generateExchangeId;
    globalScope.generatePortfolioItemJson = generatePortfolioItemJson;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      generateExchangeId,
      generatePortfolioItemJson
    };
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : {}
);
