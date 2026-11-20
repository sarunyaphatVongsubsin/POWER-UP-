"use strict";

const CHALLENGE_CONFIG = {

  challengeId: "ch-group06-number-rush",

  hostGroup: "Group 6",

  title: "Number Rush",

  category: "mix",

  role: "Challenger / Number Rush Player",

  description:
    "แก้โจทย์คำนวณ Number Rush โดยนำไพ่ตัวเลข 4 ใบ มาคำนวณ (+, −, ×, ÷) ให้ได้ผลลัพธ์เท่ากับแต้มรวมของไพ่เป้าหมาย 2 ใบ ให้ถูกต้องเร็วที่สุด",

  skills: [
    "Mental Math",
    "Arithmetic Logic",
    "Problem Solving",
    "Speed Thinking"
  ],

  defaultEvidenceUrl: "https://github.com/sarunyaphatVongsubsin/POWER-UP-",

  defaultReflection: {
    whatIDid:
      "เล่นเกม Number Rush ประจำบูธกลุ่ม 6 โดยนำเลขจากไพ่ 4 ใบมาคำนวณให้ได้ผลลัพธ์ตรงกับไพ่เป้าหมายทั้งหมด 5 รอบ",
    whatILearned:
      "ฝึกกระบวนการคิดเลขเร็ว การคิดวิเคราะห์เชิงตัวเลข และการจัดลำดับการคำนวณด้วยเครื่องหมายและวงเล็บ",
    challenge:
      "ความกดดันด้านเวลาในการแข่งความเร็ว และการจัดกลุ่มตัวเลขที่หารหรือคูณลงตัวให้ตรงเป้าหมาย",
    nextStep:
      "นำตรรกะการแก้ปัญหาและการคำนวณเชิงตัวเลขไปต่อยอดในการเขียนอัลกอริทึมโปรแกรมมิ่ง"
  }
};

if (typeof window !== "undefined") {
  window.CHALLENGE_CONFIG = CHALLENGE_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CHALLENGE_CONFIG;
}
