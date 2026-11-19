(function (globalScope) {
  "use strict";

  function isValidHttpUrl(value) {
    if (typeof value !== "string" || !value || /\s/.test(value)) {
      return false;
    }

    const lower = value.toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return false;
    }

    try {
      const parsed = new URL(value);
      return (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        Boolean(parsed.hostname)
      );
    } catch (error) {
      return false;
    }
  }

  function validateEvidenceUrls(evidenceInput) {
    const validUrls = [];
    const errors = [];

    if (evidenceInput === null || evidenceInput === undefined) {
      return {
        isValid: true,
        validUrls,
        errors
      };
    }

    let rawLines;
    if (typeof evidenceInput === "string") {
      rawLines = evidenceInput.split(/\r?\n/);
    } else if (Array.isArray(evidenceInput)) {
      rawLines = evidenceInput;
    } else {
      errors.push("รูปแบบข้อมูล Evidence ไม่ถูกต้อง (ต้องเป็นข้อความหรือ Array ของ URL)");
      return {
        isValid: false,
        validUrls,
        errors
      };
    }

    for (let index = 0; index < rawLines.length; index += 1) {
      const rawLine = rawLines[index];
      const lineNumber = index + 1;

      if (typeof rawLine !== "string") {
        errors.push(
          `บรรทัดที่ ${lineNumber}: รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)`
        );
        continue;
      }

      const trimmed = rawLine.trim();
      if (!trimmed) {
        continue;
      }

      if (isValidHttpUrl(trimmed)) {
        validUrls.push(trimmed);
      } else {
        errors.push(
          `บรรทัดที่ ${lineNumber}: รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      validUrls,
      errors
    };
  }

  if (globalScope) {
    globalScope.validateEvidenceUrls = validateEvidenceUrls;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      validateEvidenceUrls
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

  const REQUIRED_REFLECTION_FIELDS = [
    "whatIDid",
    "whatILearned",
    "challenge",
    "nextStep"
  ];

  function isItemSubmissionReady(item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    const reflection = item.reflection;
    if (
      !reflection ||
      typeof reflection !== "object" ||
      Array.isArray(reflection)
    ) {
      return false;
    }

    const hasCompleteReflection = REQUIRED_REFLECTION_FIELDS.every(field => {
      const value = reflection[field];
      return typeof value === "string" && value.trim().length > 0;
    });

    if (!hasCompleteReflection) {
      return false;
    }

    if (!Array.isArray(item.evidence) && typeof item.evidence !== "string") {
      return false;
    }

    const validator =
      globalScope && typeof globalScope.validateEvidenceUrls === "function"
        ? globalScope.validateEvidenceUrls
        : typeof module !== "undefined" &&
            module.exports &&
            typeof module.exports.validateEvidenceUrls === "function"
          ? module.exports.validateEvidenceUrls
          : null;

    if (!validator) {
      return false;
    }

    const evidenceResult = validator(item.evidence);
    return Boolean(
      evidenceResult &&
        evidenceResult.isValid === true &&
        Array.isArray(evidenceResult.validUrls) &&
        evidenceResult.validUrls.length >= 1
    );
  }

  if (globalScope) {
    globalScope.isItemSubmissionReady = isItemSubmissionReady;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports.isItemSubmissionReady = isItemSubmissionReady;
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

  const PORTFOLIOS_STORAGE_KEY = "portfolios";

  function getEvidenceValidator() {
    if (globalScope && typeof globalScope.validateEvidenceUrls === "function") {
      return globalScope.validateEvidenceUrls;
    }
    if (
      typeof module !== "undefined" &&
      module.exports &&
      typeof module.exports.validateEvidenceUrls === "function"
    ) {
      return module.exports.validateEvidenceUrls;
    }
    return null;
  }

  function extractTrimmedReflection(existingReflection, incomingReflection) {
    const existing =
      existingReflection &&
      typeof existingReflection === "object" &&
      !Array.isArray(existingReflection)
        ? existingReflection
        : {};
    const incoming =
      incomingReflection &&
      typeof incomingReflection === "object" &&
      !Array.isArray(incomingReflection)
        ? incomingReflection
        : {};

    function readField(fieldName) {
      if (Object.prototype.hasOwnProperty.call(incoming, fieldName)) {
        const value = incoming[fieldName];
        return typeof value === "string" ? value.trim() : "";
      }
      const existingValue = existing[fieldName];
      return typeof existingValue === "string" ? existingValue.trim() : "";
    }

    return {
      whatIDid: readField("whatIDid"),
      whatILearned: readField("whatILearned"),
      challenge: readField("challenge"),
      nextStep: readField("nextStep")
    };
  }

  async function updateImportedItem(itemId, updates, serverEndpoint) {
    if (typeof itemId !== "string" || !itemId.trim()) {
      return { success: false, message: "Item not found" };
    }

    let portfolios;
    try {
      if (typeof localStorage === "undefined") {
        return { success: false, message: "Item not found" };
      }
      const rawPortfolios = localStorage.getItem(PORTFOLIOS_STORAGE_KEY);
      if (!rawPortfolios) {
        return { success: false, message: "Item not found" };
      }
      portfolios = JSON.parse(rawPortfolios);
    } catch (error) {
      return { success: false, message: "Item not found" };
    }

    if (!Array.isArray(portfolios) || portfolios.length === 0) {
      return { success: false, message: "Item not found" };
    }

    let targetPortfolio = null;
    let targetItem = null;

    for (let index = 0; index < portfolios.length; index += 1) {
      const portfolio = portfolios[index];
      if (
        !portfolio ||
        typeof portfolio !== "object" ||
        !Array.isArray(portfolio.items)
      ) {
        continue;
      }

      const foundItem = portfolio.items.find(
        entry =>
          entry &&
          typeof entry === "object" &&
          (entry.id === itemId || entry.exchangeId === itemId)
      );

      if (foundItem) {
        targetPortfolio = portfolio;
        targetItem = foundItem;
        break;
      }
    }

    if (!targetPortfolio || !targetItem) {
      return { success: false, message: "Item not found" };
    }

    const safeUpdates =
      updates && typeof updates === "object" && !Array.isArray(updates)
        ? updates
        : {};
    const evidenceValidator = getEvidenceValidator();
    if (!evidenceValidator) {
      return { success: false, message: "Evidence validator is unavailable" };
    }

    const evidenceInput = Object.prototype.hasOwnProperty.call(
      safeUpdates,
      "evidence"
    )
      ? safeUpdates.evidence
      : targetItem.evidence;
    const evidenceResult = evidenceValidator(evidenceInput);

    if (!evidenceResult || evidenceResult.isValid !== true) {
      return {
        success: false,
        errors:
          evidenceResult && Array.isArray(evidenceResult.errors)
            ? evidenceResult.errors
            : ["รูปแบบข้อมูล Evidence ไม่ถูกต้อง"]
      };
    }

    const snapshotBackup = JSON.stringify(portfolios);

    try {
      targetItem.reflection = extractTrimmedReflection(
        targetItem.reflection,
        safeUpdates.reflection
      );
      targetItem.evidence = Array.isArray(evidenceResult.validUrls)
        ? [...evidenceResult.validUrls]
        : [];
      targetItem.updatedAt = new Date().toISOString();

      const endpoint =
        typeof serverEndpoint === "string" ? serverEndpoint.trim() : "";
      if (endpoint) {
        if (typeof fetch !== "function") {
          throw new Error("Fetch API is not available");
        }
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            portfolioId: targetPortfolio.portfolioId,
            itemId: targetItem.id || itemId,
            item: targetItem
          })
        });
        if (!response || !response.ok) {
          const statusCode =
            response && typeof response.status === "number"
              ? response.status
              : "unknown";
          throw new Error(`Remote save failed with status ${statusCode}`);
        }
      }

      localStorage.setItem(PORTFOLIOS_STORAGE_KEY, JSON.stringify(portfolios));
    } catch (error) {
      try {
        localStorage.setItem(PORTFOLIOS_STORAGE_KEY, snapshotBackup);
      } catch (rollbackError) {
      }
      return {
        success: false,
        message:
          error && typeof error.message === "string" && error.message
            ? error.message
            : "Failed to update item"
      };
    }

    return {
      success: true,
      item: targetItem
    };
  }

  if (globalScope) {
    globalScope.updateImportedItem = updateImportedItem;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports.updateImportedItem = updateImportedItem;
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : {}
);
