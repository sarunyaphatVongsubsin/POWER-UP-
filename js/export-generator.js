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

(function (globalScope) {
  "use strict";

  function isValidPortfolioObject(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }

    if (typeof entry.name !== "string" || !entry.name.trim()) {
      return false;
    }

    if (
      entry.portfolioId !== undefined &&
      (typeof entry.portfolioId !== "string" || !entry.portfolioId.trim())
    ) {
      return false;
    }

    if (entry.items !== undefined && !Array.isArray(entry.items)) {
      return false;
    }

    return true;
  }

  function findPortfolioById(portfolioId) {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("portfolios");
        if (raw) {
          const stored = JSON.parse(raw);
          if (Array.isArray(stored)) {
            const match = stored.find(
              entry =>
                entry &&
                typeof entry === "object" &&
                entry.portfolioId === portfolioId
            );
            if (match) {
              return match;
            }
          }
        }
      }
    } catch (error) {
    }

    const memoryPortfolios =
      typeof window !== "undefined" && Array.isArray(window.portfolios)
        ? window.portfolios
        : globalScope && Array.isArray(globalScope.portfolios)
          ? globalScope.portfolios
          : null;

    if (memoryPortfolios) {
      const match = memoryPortfolios.find(
        entry =>
          entry &&
          typeof entry === "object" &&
          entry.portfolioId === portfolioId
      );
      if (match) {
        return match;
      }
    }

    return null;
  }

  function exportPortfolio(portfolioOrId) {
    let portfolio = null;

    if (
      portfolioOrId &&
      typeof portfolioOrId === "object" &&
      !Array.isArray(portfolioOrId)
    ) {
      portfolio = portfolioOrId;
    } else if (typeof portfolioOrId === "string" && portfolioOrId.trim()) {
      portfolio = findPortfolioById(portfolioOrId.trim());
    } else {
      return null;
    }

    if (!isValidPortfolioObject(portfolio)) {
      return null;
    }

    const exportData = {
      schemaVersion: "1.0",
      portfolioId:
        typeof portfolio.portfolioId === "string" ? portfolio.portfolioId : "",
      name: portfolio.name,
      whatIEnjoy:
        typeof portfolio.whatIEnjoy === "string" ? portfolio.whatIEnjoy : "",
      whatIveTried:
        typeof portfolio.whatIveTried === "string"
          ? portfolio.whatIveTried
          : "",
      whatImCuriousAbout:
        typeof portfolio.whatImCuriousAbout === "string"
          ? portfolio.whatImCuriousAbout
          : "",
      items: Array.isArray(portfolio.items) ? portfolio.items : [],
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  if (globalScope) {
    globalScope.exportPortfolio = exportPortfolio;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports.exportPortfolio = exportPortfolio;
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : {}
);

(function (globalScope) {
  "use strict";

  function downloadJsonFile(filename, jsonString) {
    if (
      jsonString === null ||
      jsonString === undefined ||
      typeof document === "undefined" ||
      typeof Blob === "undefined" ||
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      return false;
    }

    const content =
      typeof jsonString === "string"
        ? jsonString
        : JSON.stringify(jsonString, null, 2);
    const safeFilename =
      typeof filename === "string" && filename.trim()
        ? filename.trim()
        : "export.json";

    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename;
    link.style.display = "none";

    try {
      if (document.body) {
        document.body.appendChild(link);
      }
      link.click();
    } finally {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (typeof URL.revokeObjectURL === "function") {
        if (typeof setTimeout === "function") {
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        } else {
          URL.revokeObjectURL(url);
        }
      }
    }

    return true;
  }

  async function copyJsonToClipboard(jsonString) {
    if (jsonString === null || jsonString === undefined) {
      return false;
    }

    const text =
      typeof jsonString === "string"
        ? jsonString
        : JSON.stringify(jsonString, null, 2);

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
      }
    }

    if (typeof document === "undefined" || !document.body) {
      return false;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    const previousActiveElement = document.activeElement;
    let copied = false;

    try {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      copied = Boolean(document.execCommand("copy"));
    } catch (error) {
      copied = false;
    } finally {
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      if (
        previousActiveElement &&
        typeof previousActiveElement.focus === "function"
      ) {
        previousActiveElement.focus();
      }
    }

    return copied;
  }

  if (globalScope) {
    globalScope.downloadJsonFile = downloadJsonFile;
    globalScope.copyJsonToClipboard = copyJsonToClipboard;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports.downloadJsonFile = downloadJsonFile;
    module.exports.copyJsonToClipboard = copyJsonToClipboard;
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : {}
);
