"use strict";

const CHALLENGE_CONFIG = {

  challengeId: "ch-powerup-01",

  hostGroup: "Group 6",

  title: "Website Detective: UX Auditing",

  category: "discover",

  role: "Challenger / UX Auditor",

  description:
    "Inspect a sample web interface as a Website Detective to uncover usability issues, accessibility gaps, and layout inconsistencies. Document practical UX improvement recommendations within the time limit to earn your POWER UP! portfolio item.",

  skills: [
    "UI/UX Audit",
    "Heuristic Evaluation",
    "Problem Solving"
  ],

  defaultEvidenceUrl: "https://github.com/sarunyaphatVongsubsin/POWER-UP-",

  defaultReflection: {
    whatIDid:
      "Audited the sample website interface at the POWER UP! booth, identified key usability and accessibility issues, and proposed practical UX improvements.",
    whatILearned:
      "Learned how to apply UX heuristics to evaluate navigation clarity, visual hierarchy, form feedback, and responsive design.",
    challenge:
      "Prioritizing the highest-impact usability issues and articulating clear fixes within the booth time limit.",
    nextStep:
      "Apply this UX audit checklist to evaluate and refine the usability of my own web projects and portfolio."
  }
};

if (typeof window !== "undefined") {
  window.CHALLENGE_CONFIG = CHALLENGE_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CHALLENGE_CONFIG;
}
