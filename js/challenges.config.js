"use strict";

const CHALLENGE_CONFIG = {

  challengeId: "",

  hostGroup: "Group 6",

  title: "",

  category: "",

  role: "",

  description:
    "",

  skills: [""],

  defaultEvidenceUrl: "https://github.com/sarunyaphatVongsubsin/POWER-UP-",

  defaultReflection: {
    whatIDid:
      "",
    whatILearned:
      "",
    challenge:
      "",
    nextStep:
      ""
  }
};

if (typeof window !== "undefined") {
  window.CHALLENGE_CONFIG = CHALLENGE_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CHALLENGE_CONFIG;
}
