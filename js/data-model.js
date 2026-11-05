function createReflection(data = {}) {
  return {
    whatIDid: data.whatIDid || "",
    whatILearned: data.whatILearned || "",
    challenge: data.challenge || "",
    nextStep: data.nextStep || ""
  };
}

function createPortfolioItem(data = {}) {
  return {
    id: data.id || "",
    title: data.title || "",
    type: data.type || "",
    date: data.date || "",
    role: data.role || "",
    description: data.description || "",
    skills: Array.isArray(data.skills) ? [...data.skills] : [],
    reflection: createReflection(data.reflection),
    evidence: Array.isArray(data.evidence) ? [...data.evidence] : []
  };
}

function createPortfolio(data = {}) {
  return {
    portfolioId: data.portfolioId || "",
    name: data.name || "",
    whatIEnjoy: data.whatIEnjoy || "",
    whatIveTried: data.whatIveTried || "",
    whatImCuriousAbout: data.whatImCuriousAbout || "",
    items: Array.isArray(data.items)
      ? data.items.map(item => createPortfolioItem(item))
      : []
  };
}
