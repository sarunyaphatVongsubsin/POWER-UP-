"use strict";

// ตรวจสอบไฟล์ JSON ที่ได้รับจากกลุ่มอื่น
function validatePortfolioItemJson(text) {
  const errors = [];
  let data;

  // 1. ตรวจสอบว่าอ่านข้อความ JSON ได้หรือไม่
  try {
    data = JSON.parse(text);
  } catch {
    return {
      valid: false,
      errors: ["ไฟล์ JSON ไม่ถูกต้อง หรืออ่านข้อมูลไม่ได้"],
      data: null
    };
  }

  // 2. ตรวจสอบว่า JSON หลักเป็น Object
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      errors: ["ข้อมูล JSON ต้องเป็น Object"],
      data
    };
  }

  // 3. ตรวจสอบข้อมูล Wrapper
  if (data.schema !== "powerup-portfolio-item") {
    errors.push("schema ไม่ถูกต้อง");
  }

  if (data.version !== 1) {
    errors.push("version ต้องเป็น 1");
  }

  if (typeof data.exchangeId !== "string" || !data.exchangeId.trim()) {
    errors.push("exchangeId จำเป็นต้องมีข้อมูล");
  }

  // 4. ตรวจสอบวันที่ส่งออก
  if (typeof data.issuedAt !== "string" ||
      Number.isNaN(Date.parse(data.issuedAt))) {
    errors.push("issuedAt ต้องเป็นวันที่ที่ถูกต้อง");
  }

  // 5. ตรวจสอบข้อมูล Source
  if (!data.source || typeof data.source !== "object" ||
      Array.isArray(data.source)) {
    errors.push("source ต้องเป็น Object");
  } else {
    ["group", "booth", "challenge", "host"].forEach(field => {
      if (typeof data.source[field] !== "string" ||
          !data.source[field].trim()) {
        errors.push(`source.${field} จำเป็นต้องมีข้อมูล`);
      }
    });
  }

  // 6. ตรวจสอบ Portfolio Item ด้วยฟังก์ชันเดิม
  if (!data.item || typeof data.item !== "object" ||
      Array.isArray(data.item)) {
    errors.push("item ต้องเป็น Object");
  } else if (typeof validatePortfolioItemData === "function") {
    validatePortfolioItemData(data.item).forEach(error => {
      errors.push(`item: ${error}`);
    });
  } else {
    errors.push("ไม่พบฟังก์ชัน validatePortfolioItemData");
  }

  // 7. ส่งผลลัพธ์กลับ
  return {
    valid: errors.length === 0,
    errors,
    data
  };
}
