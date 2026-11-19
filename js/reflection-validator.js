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
