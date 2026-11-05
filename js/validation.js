
function validatePortfolioData(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Portfolio data must be an object"];
  }

  const requiredFields = [
    "portfolioId",
    "name",
    "whatIEnjoy",
    "whatIveTried",
    "whatImCuriousAbout"
  ];

  requiredFields.forEach(field => {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      errors.push(`${field} is required`);
    }
  });

  if (!Array.isArray(data.items)) {
    errors.push("Items must be an array");
  } else {
    data.items.forEach((item, index) => {
      const itemErrors = validatePortfolioItemData(item);

      itemErrors.forEach(error => {
        errors.push(`Item ${index + 1}: ${error}`);
      });
    });
  }

  return errors;
}

function validatePortfolioItemData(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Portfolio item must be an object"];
  }

  const requiredFields = [
    "id",
    "title",
    "type",
    "date",
    "role",
    "description"
  ];

  requiredFields.forEach(field => {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      errors.push(`${field} is required`);
    }
  });

  if (typeof data.date === "string" && data.date.trim()) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const date = new Date(data.date);

    if (
      !datePattern.test(data.date) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== data.date
    ) {
      errors.push("Date must be a valid YYYY-MM-DD date");
    }
  }

  if (
    !Array.isArray(data.skills) ||
    !data.skills.every(skill => typeof skill === "string")
  ) {
    errors.push("Skills must be an array of strings");
  }

  if (!data.reflection || typeof data.reflection !== "object" || Array.isArray(data.reflection)) {
    errors.push("Reflection must be an object");
  } else {
    const reflectionFields = [
      "whatIDid",
      "whatILearned",
      "challenge",
      "nextStep"
    ];

    reflectionFields.forEach(field => {
      if (typeof data.reflection[field] !== "string") {
        errors.push(`Reflection ${field} must be a string`);
      }
    });
  }

  if (!Array.isArray(data.evidence)) {
    errors.push("Evidence must be an array");
  } else {
    data.evidence.forEach(url => {
      if (typeof url !== "string") {
        errors.push("Evidence URL must be a string");
        return;
      }

      try {
        const parsedURL = new URL(url);

        if (!["http:", "https:"].includes(parsedURL.protocol) || !parsedURL.hostname) {
          errors.push(`Invalid Evidence URL: ${url}`);
        }
      } catch {
        errors.push(`Invalid Evidence URL: ${url}`);
      }
    });
  }

  return errors;
}
