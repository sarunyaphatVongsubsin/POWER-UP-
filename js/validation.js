function validatePortfolioData(data) {
  const errors = [];

  const requiredFields = [
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
  }

  return errors;
}

function validatePortfolioItemData(data) {
  const errors = [];

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

  if (data.date) {
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

  if (!Array.isArray(data.skills)) {
    errors.push("Skills must be an array");
  }

  if (!Array.isArray(data.evidence)) {
    errors.push("Evidence must be an array");
  } else {
    data.evidence.forEach(url => {
      try {
        const parsedURL = new URL(url);

        if (!["http:", "https:"].includes(parsedURL.protocol)) {
          errors.push(`Invalid Evidence URL: ${url}`);
        }
      } catch {
        errors.push(`Invalid Evidence URL: ${url}`);
      }
    });
  }

  return errors;
}
