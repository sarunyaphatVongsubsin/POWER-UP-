"use strict";

// ไฟล์ JSON ตัวอย่างและ Key สำหรับ Local Storage
const SAMPLE_FILES = ["sample-portfolio-1.json", "sample-portfolio-2.json"];
const PORTFOLIOS_KEY = "portfolios";
const CURRENT_ID_KEY = "currentPortfolioId";

// ---------- DATA MODEL ----------

// สร้าง Reflection ให้มีฟิลด์ครบเสมอ
function createReflection(data = {}) {
  return {
    whatIDid: data.whatIDid || "",
    whatILearned: data.whatILearned || "",
    challenge: data.challenge || "",
    nextStep: data.nextStep || ""
  };
}

// สร้าง Item พร้อมค่าเริ่มต้นและคัดลอก Array ป้องกันการอ้างอิงร่วม
function createPortfolioItem(data = {}) {
  const item = {
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

  // เก็บ Optional Metadata ที่รองรับไว้ แต่ไม่แสดงในหน้า Portfolio
  ["schemaVersion", "challengeId", "hostGroup", "category", "importStatus"]
    .forEach(field => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        item[field] = data[field];
      }
    });

  return item;
}

// สร้าง Portfolio และแปลง Item ทุกชิ้นให้เป็นรูปแบบมาตรฐาน
function createPortfolio(data = {}) {
  return {
    portfolioId: data.portfolioId || "",
    name: data.name || "",
    whatIEnjoy: data.whatIEnjoy || "",
    whatIveTried: data.whatIveTried || "",
    whatImCuriousAbout: data.whatImCuriousAbout || "",
    items: Array.isArray(data.items) ? data.items.map(createPortfolioItem) : []
  };
}

// ---------- VALIDATION ----------

// ตรวจสอบฟิลด์บังคับและ Item ทั้งหมดใน Portfolio
function validatePortfolioData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    return ["Portfolio data must be an object"];

  const errors = [];
  ["portfolioId", "name", "whatIEnjoy", "whatIveTried", "whatImCuriousAbout"]
    .forEach(field => {
      if (typeof data[field] !== "string" || !data[field].trim())
        errors.push(`${field} is required`);
    });

  if (!Array.isArray(data.items)) {
    errors.push("Items must be an array");
  } else {
    data.items.forEach((item, index) =>
      validatePortfolioItemData(item, "booth").forEach(error =>
        errors.push(`Item ${index + 1}: ${error}`)
      )
    );
  }
  return errors;
}

// ตรวจสอบข้อมูล Item รวมถึงวันที่ Skills, Reflection และ Evidence

function validatePortfolioItemData(data, level = "submission") {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Portfolio item must be an object"];
  }

  if (!["booth", "submission"].includes(level)) {
    return ["Invalid validation level"];
  }

  const errors = [];

  // Required fields at booth level
  ["id", "title", "type", "date", "role", "description"].forEach(field => {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      errors.push(`${field} is required`);
    }
  });

  // Validate date
  if (typeof data.date === "string" && data.date.trim()) {
    const date = new Date(data.date);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== data.date
    ) {
      errors.push("Date must be a valid YYYY-MM-DD date");
    }
  }

  // Validate skills
  if (
    !Array.isArray(data.skills) ||
    !data.skills.every(skill =>
      typeof skill === "string" && skill.trim()
    )
  ) {
    errors.push("Skills must be an array of non-empty strings");
  }

  // Additional requirements at submission level
  if (level === "submission") {
    if (
      !data.reflection ||
      typeof data.reflection !== "object" ||
      Array.isArray(data.reflection)
    ) {
      errors.push("Reflection must be an object");
    } else {
      ["whatIDid", "whatILearned", "challenge", "nextStep"].forEach(field => {
        if (
          typeof data.reflection[field] !== "string" ||
          !data.reflection[field].trim()
        ) {
          errors.push(
            `Reflection ${field} is required and must be a non-empty string`
          );
        }
      });
    }

    if (!Array.isArray(data.evidence) || data.evidence.length === 0) {
      errors.push("Evidence must be a non-empty array");
    } else {
      data.evidence.forEach(url => {
        if (typeof url !== "string") {
          errors.push("Evidence URL must be a string");
          return;
        }

        try {
          const parsed = new URL(url);

          if (
            !["http:", "https:"].includes(parsed.protocol) ||
            !parsed.hostname
          ) {
            errors.push(`Invalid Evidence URL: ${url}`);
          }
        } catch {
          errors.push(`Invalid Evidence URL: ${url}`);
        }
      });
    }
  }

  return errors;
}

// ---------- IMPORT VALIDATION (รวมจาก portfolio-item-validation.js) ----------

const IMPORT_MAX_BYTES = 256 * 1024;
const IMPORT_FIELD_LIMITS = {
  id: 100,
  title: 150,
  type: 100,
  role: 150,
  description: 2000,
  skill: 50,
  reflection: 2000,
  evidenceUrl: 2048,
  optional: 100
};

// ตรวจสอบขนาดข้อความ JSON และโครงสร้าง Portfolio Item โดยตรง (ไม่มี Wrapper)
function validatePortfolioItemJson(text) {
  const errors = [];

  if (typeof text !== "string" || !text.trim()) {
    return { valid: false, errors: ["กรุณาระบุข้อมูล JSON"], data: null };
  }

  if (new Blob([text]).size > IMPORT_MAX_BYTES) {
    return {
      valid: false,
      errors: [`ข้อมูล JSON มีขนาดเกิน ${IMPORT_MAX_BYTES / 1024} KB`],
      data: null
    };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { valid: false, errors: ["JSON ไม่ถูกต้อง กรุณาตรวจสอบเครื่องหมายหรือรูปแบบข้อมูล"], data: null };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["ข้อมูล JSON ต้องเป็น Object ของ Portfolio Item"], data: data ?? null };
  }

  // ตรวจสอบฟิลด์หลักตามโครงสร้างที่ตกลงกัน
  errors.push(...validatePortfolioItemData(data, "booth"));

  // จำกัดความยาวฟิลด์ข้อความหลัก
  ["id", "title", "type", "role", "description"].forEach(field => {
    if (typeof data[field] === "string" && data[field].length > IMPORT_FIELD_LIMITS[field]) {
      errors.push(`${field} ต้องมีความยาวไม่เกิน ${IMPORT_FIELD_LIMITS[field]} ตัวอักษร`);
    }
  });

  // จำกัดจำนวนและความยาว Skills
  if (Array.isArray(data.skills)) {
    if (data.skills.length > 20) errors.push("skills มีได้ไม่เกิน 20 รายการ");
    data.skills.forEach((skill, index) => {
      if (typeof skill === "string" && skill.length > IMPORT_FIELD_LIMITS.skill) {
        errors.push(`skills[${index}] ต้องมีความยาวไม่เกิน ${IMPORT_FIELD_LIMITS.skill} ตัวอักษร`);
      }
    });
  }

  // Reflection ต้องมี Object และฟิลด์ครบ แต่ยอมให้ค่าว่างเพื่อรอทำ Reflection ภายหลัง
  if (!data.reflection || typeof data.reflection !== "object" || Array.isArray(data.reflection)) {
    errors.push("reflection ต้องเป็น Object");
  } else {
    ["whatIDid", "whatILearned", "challenge", "nextStep"].forEach(field => {
      const value = data.reflection[field];
      if (typeof value !== "string") {
        errors.push(`reflection.${field} ต้องเป็นข้อความ`);
      } else if (value.length > IMPORT_FIELD_LIMITS.reflection) {
        errors.push(`reflection.${field} ต้องมีความยาวไม่เกิน ${IMPORT_FIELD_LIMITS.reflection} ตัวอักษร`);
      }
    });
  }

  // Evidence ต้องเป็น Array; ยอมให้เป็น [] เพื่อรอแนบหลักฐานภายหลัง
  if (!Array.isArray(data.evidence)) {
    errors.push("evidence ต้องเป็น Array");
  } else {
    if (data.evidence.length > 10) errors.push("evidence มีได้ไม่เกิน 10 รายการ");
    data.evidence.forEach((url, index) => {
      if (typeof url !== "string") {
        errors.push(`evidence[${index}] ต้องเป็นข้อความ URL`);
        return;
      }
      if (url.length > IMPORT_FIELD_LIMITS.evidenceUrl) {
        errors.push(`evidence[${index}] ต้องมีความยาวไม่เกิน ${IMPORT_FIELD_LIMITS.evidenceUrl} ตัวอักษร`);
        return;
      }
      if (!url.trim()) return;
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
          errors.push(`evidence[${index}] ต้องเป็น HTTP หรือ HTTPS URL`);
        }
      } catch {
        errors.push(`evidence[${index}] ไม่ใช่ URL ที่ถูกต้อง`);
      }
    });
  }

  // Optional Metadata: ตรวจสอบเมื่อมีค่า และเก็บไว้โดยไม่แสดงบนหน้าเว็บ
  if (data.schemaVersion !== undefined && data.schemaVersion !== "1.0") {
    errors.push('schemaVersion หากระบุต้องเป็น "1.0"');
  }

  ["challengeId", "hostGroup"].forEach(field => {
    if (data[field] !== undefined && (
      typeof data[field] !== "string" ||
      !data[field].trim() ||
      data[field].length > IMPORT_FIELD_LIMITS.optional
    )) {
      errors.push(`${field} ต้องเป็นข้อความที่มีความยาว 1-${IMPORT_FIELD_LIMITS.optional} ตัวอักษร`);
    }
  });

  if (data.category !== undefined && !["discover", "mix", "levelup"].includes(data.category)) {
    errors.push('category ต้องเป็น discover, mix หรือ levelup');
  }

  return { valid: errors.length === 0, errors, data };
}

// ตรวจสอบนามสกุลและขนาดไฟล์ก่อนอ่าน โดยไม่แยกชุด Validation JSON
function validateJsonFileMeta(file) {
  if (!file) return "ไม่พบไฟล์ที่เลือก";
  if (!/\.json$/i.test(file.name || "")) return "กรุณาเลือกไฟล์นามสกุล .json เท่านั้น";
  if (file.size > IMPORT_MAX_BYTES) return `ไฟล์ต้องมีขนาดไม่เกิน ${IMPORT_MAX_BYTES / 1024} KB`;
  return "";
}

// Import Item ลง Portfolio ใน Local Storage; ตรวจสอบซ้ำและบันทึกแบบไม่แก้ข้อมูลเดิมหากล้มเหลว
function importPortfolioItem(text, portfolioId, storage = localStorage) {
  const validation = validatePortfolioItemJson(text);
  if (!validation.valid) return { success: false, error: validation.errors.join(" | ") };
  if (typeof portfolioId !== "string" || !portfolioId.trim()) {
    return { success: false, error: "กรุณาเลือก Portfolio ปลายทาง" };
  }

  try {
    const storedText = storage.getItem(PORTFOLIOS_KEY);
    if (!storedText) return { success: false, error: "ไม่พบข้อมูล Portfolio ใน Local Storage" };

    const portfolios = JSON.parse(storedText);
    if (!Array.isArray(portfolios)) throw new Error("ข้อมูล Portfolio ใน Local Storage ไม่ถูกต้อง");

    const target = portfolios.find(portfolio => portfolio.portfolioId === portfolioId);
    if (!target) return { success: false, error: "ไม่พบ Portfolio ปลายทาง" };
    if (!Array.isArray(target.items)) target.items = [];

    const itemId = validation.data.id;
    if (target.items.some(item => item.id === itemId)) {
      return { success: false, error: `ID "${itemId}" ถูก Import ใน Portfolio นี้แล้ว ไม่สามารถ Import ซ้ำได้` };
    }

    // กำหนดสถานะเริ่มต้นสำหรับ Issue 10 และเก็บ Optional Metadata ที่รองรับ
    const importedItem = createPortfolioItem({
      ...validation.data,
      importStatus: "pending"
    });

    target.items.push(importedItem);

    // เขียนเพียง Key หลักหนึ่งครั้ง; หาก setItem ล้มเหลว ข้อมูลเดิมจะยังไม่ถูกเปลี่ยน
    storage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios));

    // แจ้งหน้าแอปให้โหลดข้อมูลล่าสุดและแสดง Item ที่เพิ่ง Import
    if (typeof window !== "undefined" && storage === window.localStorage) {
      window.dispatchEvent(new CustomEvent("portfolio:item-imported", {
        detail: { portfolioId, itemId }
      }));
    }

    return { success: true, item: importedItem };
  } catch (error) {
    return { success: false, error: `บันทึกข้อมูลไม่สำเร็จ: ${error.message || "เกิดข้อผิดพลาดใน Local Storage"}` };
  }
}


// ตรวจสอบข้อมูลทุก Portfolio และข้ามรายการที่ไม่ผ่าน
function sanitizePortfolios(list, source) {
  return list.reduce((valid, portfolio) => {
    const errors = validatePortfolioData(portfolio);
    if (errors.length) console.warn(`ข้าม portfolio จาก ${source}:`, errors);
    else valid.push(createPortfolio(portfolio));
    return valid;
  }, []);
}

// ---------- STORAGE ----------

// อ่านข้อมูลจาก Local Storage; คืน null เมื่อไม่มีหรือข้อมูลเสีย
function readPortfolios() {
  try {
    const data = JSON.parse(localStorage.getItem(PORTFOLIOS_KEY));
    if (!Array.isArray(data)) return null;
    const valid = sanitizePortfolios(data, "localStorage");
    return data.length && !valid.length ? null : valid;
  } catch {
    return null;
  }
}

// บันทึก Portfolio ทั้งหมดลง Local Storage
function savePortfolios(list) {
  localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(list));
}

// โหลด JSON ตัวอย่าง ตรวจสอบ และแปลงข้อมูลก่อนใช้งาน
async function fetchSamplePortfolios() {
  const results = await Promise.all(SAMPLE_FILES.map(async file => {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`โหลด ${file} ไม่สำเร็จ (${response.status})`);
    return response.json();
  }));
  return sanitizePortfolios(results.flat(), "sample files");
}

// ---------- UI HELPERS ----------

// แสดง Toast แจ้งผลการทำงานชั่วคราว
function showStatus(message, type = "success") {
  const area = document.getElementById("toast-area");
  if (!area) return;

  const kind = type === "danger" ? "error" :
    type === "warning" ? "warning" : "success";
  const toast = document.createElement("div");
  toast.className = `toast-msg ${kind}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  area.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// สร้างหน้าต่างยืนยัน และคืน true เมื่อยืนยันหรือ false เมื่อยกเลิก
function confirmDialog(message, options = {}) {
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";

    const box = document.createElement("div");
    box.className = "confirm-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "confirm-title");

    const title = document.createElement("h3");
    title.id = "confirm-title";
    title.className = "confirm-title";
    title.textContent = options.title || "ยืนยันการทำรายการ";

    const messageElement = document.createElement("p");
    messageElement.className = "confirm-message";
    messageElement.textContent = message;

    const actions = document.createElement("div");
    actions.className = "confirm-actions";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-confirm-cancel";
    cancel.textContent = options.cancelText || "ยกเลิก";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "btn-confirm-ok";
    confirm.textContent = options.confirmText || "ยืนยัน";

    // ปิดหน้าต่าง ลบ Event และคืน Focus ไปยังตำแหน่งเดิม
    function close(result) {
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
      previousFocus?.focus?.();
      resolve(result);
    }

    // กด Escape เพื่อยกเลิก
    function handleKeydown(event) {
      if (event.key === "Escape") close(false);
    }

    cancel.addEventListener("click", () => close(false));
    confirm.addEventListener("click", () => close(true));
    overlay.addEventListener("click", event => {
      if (event.target === overlay) close(false);
    });
    document.addEventListener("keydown", handleKeydown);

    actions.append(cancel, confirm);
    box.append(title, messageElement, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    cancel.focus();
  });
}

// แยกข้อความที่คั่นด้วย comma หรือขึ้นบรรทัดใหม่เป็น Array
function splitList(text) {
  return text.split(/[,\n]/).map(value => value.trim()).filter(Boolean);
}

// ---------- MAIN APP ----------

// เริ่มแอป โหลดข้อมูล ผูก Event และแสดงหน้าเว็บ
async function initializeApp() {
  const $ = id => document.getElementById(id);
  const portfolioCountEl = $("portfolio-count");
  const portfolioSelectEl = $("portfolio-select");
  const viewWhatEnjoyEl = $("view-what-enjoy");
  const viewWhatTriedEl = $("view-what-tried");
  const viewWhatCuriousEl = $("view-what-curious");
  const portfolioItemsCountEl = $("portfolio-items-count");
  const itemsListEl = $("portfolio-items-list");

  // ใช้ข้อมูล Local Storage ก่อน หากไม่มีจึงโหลด JSON ตัวอย่าง
  let portfolios = readPortfolios();
  if (portfolios === null) {
    try {
      portfolios = await fetchSamplePortfolios();
      savePortfolios(portfolios);
    } catch (error) {
      console.error(error);
      portfolios = [];
      showStatus("โหลดข้อมูลตัวอย่างไม่ได้ (ต้องเปิดผ่าน server เช่น Live Server ไม่ใช่ file://)", "danger");
    }
  }

  // คืนค่า Portfolio ที่ผู้ใช้เลือกอยู่
  function getCurrentPortfolio() {
    const id = localStorage.getItem(CURRENT_ID_KEY);
    return portfolios.find(portfolio => portfolio.portfolioId === id) || null;
  }

  // สร้างส่วนแสดง Reflection หนึ่งหัวข้อ
  function createReflectionBlock(label, text) {
    const wrap = document.createElement("div");
    wrap.className = "reflection-block";

    const labelEl = document.createElement("div");
    labelEl.className = "reflection-label";
    labelEl.textContent = label;

    const textEl = document.createElement("div");
    textEl.className = "reflection-text";
    textEl.textContent = text || "-";

    wrap.append(labelEl, textEl);
    return wrap;
  }

  // วาดการ์ด Item ทั้งหมดของ Portfolio ที่เลือก
  function renderItems(portfolio) {
    if (!itemsListEl) return;
    itemsListEl.innerHTML = "";

    const items = Array.isArray(portfolio?.items) ? portfolio.items : [];
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "text-muted mb-0";
      empty.textContent = "ยังไม่มี Item ใน Portfolio นี้";
      itemsListEl.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const reflection = item.reflection || {};
      const card = document.createElement("article");
      card.className = "item-card";

      const top = document.createElement("div");
      top.className = "item-top";

      const type = document.createElement("span");
      type.className = "item-type";
      type.textContent = item.type || "Other";

      const date = document.createElement("span");
      date.className = "item-date";
      date.textContent = `📅 ${item.date || "-"}`;
      top.append(type, date);

      const title = document.createElement("h3");
      title.textContent = item.title;

      const role = document.createElement("div");
      role.className = "item-meta";
      role.textContent = `🌸 ${item.role || "-"}`;

      const description = document.createElement("p");
      description.className = "item-desc";
      description.textContent = item.description;

      // แสดง Skills เป็นป้าย
      const skills = document.createElement("div");
      skills.className = "skill-list";
      (item.skills || []).forEach(skill => {
        const chip = document.createElement("span");
        chip.className = "skill-chip";
        chip.textContent = skill;
        skills.appendChild(chip);
      });

      // แสดง Reflection ทั้ง 4 หัวข้อ
      const reflectionEl = document.createElement("div");
      reflectionEl.className = "reflection";
      reflectionEl.append(
        createReflectionBlock("What I did", reflection.whatIDid),
        createReflectionBlock("What I learned", reflection.whatILearned),
        createReflectionBlock("Challenge", reflection.challenge),
        createReflectionBlock("Next step", reflection.nextStep)
      );

      // แสดง Evidence เป็นลิงก์เมื่อเป็น URL
      const evidenceLabel = document.createElement("div");
      evidenceLabel.className = "evidence-label";
      evidenceLabel.textContent = "🔗 Evidence";

      const evidenceList = document.createElement("ul");
      evidenceList.className = "evidence-list";
      (item.evidence || []).forEach(url => {
        const li = document.createElement("li");
        if (/^https?:\/\//i.test(url)) {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = url;
          li.appendChild(link);
        } else {
          li.textContent = url;
        }
        evidenceList.appendChild(li);
      });

      // ปุ่มลบ Item ของการ์ด
      const footer = document.createElement("div");
      footer.className = "item-footer";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-delete-item";
      deleteButton.textContent = "🗑 ลบ Item";
      deleteButton.addEventListener("click", () => deleteItem(item.id));
      footer.appendChild(deleteButton);

      card.append(top, title, role, description, skills,
        reflectionEl, evidenceLabel, evidenceList, footer);
      itemsListEl.appendChild(card);
    });
  }

  // ลบ Item หลังยืนยัน แล้วบันทึกและแสดงข้อมูลใหม่
  async function deleteItem(itemId) {
    const target = getCurrentPortfolio();
    if (!target) return;

    const confirmed = await confirmDialog(
      "ต้องการลบ Item นี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้",
      { title: "ลบ Item", confirmText: "ลบ" }
    );
    if (!confirmed) return;

    target.items = (target.items || []).filter(item => item.id !== itemId);
    savePortfolios(portfolios);
    renderPortfolioView(target);
    showStatus("ลบ Item เรียบร้อยแล้ว!");
  }

  // อัปเดตข้อมูลภาพรวมและจำนวน Item
  function renderPortfolioView(portfolio) {
    const current = portfolio || {};
    if (viewWhatEnjoyEl) viewWhatEnjoyEl.textContent = current.whatIEnjoy || "-";
    if (viewWhatTriedEl) viewWhatTriedEl.textContent = current.whatIveTried || "-";
    if (viewWhatCuriousEl) viewWhatCuriousEl.textContent = current.whatImCuriousAbout || "-";
    if (portfolioItemsCountEl)
      portfolioItemsCountEl.textContent = current.items?.length || 0;
    renderItems(portfolio);
  }

  // สร้าง Dropdown และเลือก Portfolio ล่าสุดหรือรายการแรก
  function renderSelect() {
    if (!portfolioSelectEl) return;
    portfolioSelectEl.innerHTML = '<option value="" disabled>-- เลือก Portfolio --</option>';

    portfolios.forEach(portfolio => {
      const option = document.createElement("option");
      option.value = portfolio.portfolioId;
      option.textContent = portfolio.name;
      portfolioSelectEl.appendChild(option);
    });

    const current = getCurrentPortfolio() || portfolios[0] || null;
    if (current) {
      portfolioSelectEl.value = current.portfolioId;
      localStorage.setItem(CURRENT_ID_KEY, current.portfolioId);
    } else {
      portfolioSelectEl.value = "";
      localStorage.removeItem(CURRENT_ID_KEY);
    }
    renderPortfolioView(current);
  }

  // อัปเดตจำนวน Portfolio และวาดข้อมูลทั้งหมด
  function renderAll() {
    if (portfolioCountEl) portfolioCountEl.textContent = portfolios.length;
    renderSelect();
  }

  renderAll();

  // โหลดข้อมูลล่าสุดหลัง Import สำเร็จ และเลือก Portfolio ปลายทางให้ผู้ใช้เห็น Item ใหม่
  window.addEventListener("portfolio:item-imported", event => {
    const latestPortfolios = readPortfolios();
    if (latestPortfolios !== null) portfolios = latestPortfolios;
    const importedPortfolioId = event.detail?.portfolioId;
    if (importedPortfolioId) localStorage.setItem(CURRENT_ID_KEY, importedPortfolioId);
    renderAll();
  });

  // เมื่อเปลี่ยน Dropdown ให้บันทึก ID และแสดง Portfolio ใหม่
  portfolioSelectEl?.addEventListener("change", event => {
    localStorage.setItem(CURRENT_ID_KEY, event.target.value);
    renderPortfolioView(getCurrentPortfolio());
  });

  // ปุ่ม Reset: โหลด JSON ตัวอย่างและแทนที่ข้อมูลเดิม
  $("btn-reset-data")?.addEventListener("click", async () => {
    const confirmed = await confirmDialog(
      "ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างใช่หรือไม่? ข้อมูลที่เพิ่มไว้จะหายทั้งหมด",
      { title: "Reset Data", confirmText: "รีเซ็ต" }
    );
    if (!confirmed) return;

    try {
      portfolios = await fetchSamplePortfolios();
      savePortfolios(portfolios);
      localStorage.removeItem(CURRENT_ID_KEY);
      renderAll();
      showStatus("รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว!");
    } catch (error) {
      console.error(error);
      showStatus("รีเซ็ตไม่สำเร็จ: โหลดไฟล์ตัวอย่างไม่ได้", "danger");
    }
  });

  // ฟอร์มสร้าง Portfolio ใหม่
  const portfolioForm = $("portfolio-form");
  portfolioForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!portfolioForm.checkValidity()) {
      event.stopPropagation();
      portfolioForm.classList.add("was-validated");
      return;
    }

    const newPortfolio = {
      portfolioId: `port-${Date.now()}`,
      name: $("p-name").value.trim(),
      whatIEnjoy: $("p-enjoy").value.trim(),
      whatIveTried: $("p-tried").value.trim(),
      whatImCuriousAbout: $("p-curious").value.trim(),
      items: []
    };

    const errors = validatePortfolioData(newPortfolio);
    if (errors.length) return showStatus(errors[0], "danger");

    portfolios.push(createPortfolio(newPortfolio));
    savePortfolios(portfolios);
    localStorage.setItem(CURRENT_ID_KEY, newPortfolio.portfolioId);
    renderAll();
    showStatus("บันทึกข้อมูล Portfolio สำเร็จเรียบร้อยแล้ว!");
    portfolioForm.reset();
    portfolioForm.classList.remove("was-validated");
  });

  // ฟอร์มเพิ่ม Item ใน Portfolio ที่เลือก
  const itemForm = $("item-form");
  itemForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!itemForm.checkValidity()) {
      event.stopPropagation();
      itemForm.classList.add("was-validated");
      return;
    }

    const target = getCurrentPortfolio();
    if (!target) return showStatus("กรุณาเลือกหรือสร้าง Portfolio ก่อนเพิ่ม Item", "warning");

    // อ่านค่าในฟอร์มตาม ID; คืนค่าว่างหากไม่พบ Element
    const getValue = id => $(id)?.value.trim() || "";
    const newItem = {
      id: `item-${Date.now()}`,
      title: getValue("item-title"),
      type: getValue("item-type"),
      date: getValue("item-date"),
      role: getValue("item-role"),
      description: getValue("item-description"),
      skills: splitList(getValue("item-skills")),
      reflection: {
        whatIDid: getValue("item-what-did"),
        whatILearned: getValue("item-what-learned"),
        challenge: getValue("item-challenge"),
        nextStep: getValue("item-next-step")
      },
      evidence: splitList(getValue("item-evidence"))
    };

    const errors = validatePortfolioItemData(newItem, "booth");
    if (errors.length) return showStatus(errors[0], "danger");

    if (!Array.isArray(target.items)) target.items = [];
    target.items.push(createPortfolioItem(newItem));
    savePortfolios(portfolios);
    renderPortfolioView(target);
    showStatus("บันทึก Portfolio Item สำเร็จเรียบร้อยแล้ว!");
    itemForm.reset();
    itemForm.classList.remove("was-validated");
  });
}

// เริ่มทำงานเมื่อ HTML โหลด DOM เสร็จ
document.addEventListener("DOMContentLoaded", () => {
  // เริ่มระบบ Portfolio เฉพาะหน้า index.html
  if (document.getElementById("portfolio-select")) initializeApp();
});


/* =================================
   POWER UP NAVIGATION
================================= */

function initializePowerUpNavigation() {

  // 1. Add Item: Scroll ไปยังฟอร์ม
  document.querySelectorAll("[data-scroll-target]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const targetId = button.dataset.scrollTarget;
        const target = document.getElementById(targetId);

        if (!target) return;

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        // Focus ไม่เปลี่ยน และไม่ซ่อนฟอร์ม
      });
    });


  // 2. Smooth Scroll เมนู
  const navLinks = document.querySelectorAll(
    '.app-nav .nav-link[href^="#"]'
  );

  navLinks.forEach(link => {

    link.addEventListener("click", event => {

      const targetId = link.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      // ปิด Hamburger หลังเลือกเมนู
      const navbar = document.getElementById("mainNavbar");

      if (navbar && navbar.classList.contains("show")) {
        bootstrap.Collapse
          .getOrCreateInstance(navbar)
          .hide();
      }

    });

  });


  // 3. Active Menu
  const sections = document.querySelectorAll(
    "#portfolios-section, #portfolio-items-section"
  );

  const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if (!entry.isIntersecting) return;

      navLinks.forEach(link => {

        const isActive =
          link.getAttribute("href") ===
          "#" + entry.target.id;

        link.classList.toggle("active", isActive);

      });

    });

  }, {
    rootMargin: "-120px 0px -55% 0px"
  });

  sections.forEach(section => observer.observe(section));

}


// รองรับกรณีโหลด JavaScript ก่อนหรือหลัง DOM
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializePowerUpNavigation
  );
} else {
  initializePowerUpNavigation();
}


// ---------- IMPORT PORTFOLIO ITEM (Issue #25 / #27) ----------
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const targetPortSelect = $("import-target-port");
  const btnDownloadSample = $("btn-download-sample");
  const dropZone = $("import-drop-zone");
  const fileInput = $("import-file-input");
  const textarea = $("import-textarea");
  const errorAlert = $("import-error-alert");
  const previewBox = $("import-preview-box");
  const statusBox = $("import-status-box");
  const statusText = $("import-status-text");
  const btnRetry = $("btn-retry-import");
  const btnPreview = $("btn-preview-json");
  const btnImport = $("btn-confirm-import");
  const btnOpenImport = $("btn-import-item");

  if (!targetPortSelect && !textarea && !fileInput) return;

  let verifiedItemData = null;

  // แสดง Error ด้วย textContent เพื่อป้องกันการแทรก HTML/XSS
  function showImportError(message) {
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove("d-none");
    }
    if (previewBox) previewBox.classList.add("d-none");
    if (btnImport) btnImport.disabled = true;
    verifiedItemData = null;
  }

  // แสดงสถานะการ Import ด้วย textContent
  function showImportStatus(message, alertClass = "alert-info") {
    if (!statusBox || !statusText) return;
    statusBox.className = `alert ${alertClass} py-2 px-3 mb-3`;
    statusText.textContent = message;
    statusBox.classList.remove("d-none");
  }

  // ซ่อนข้อความแจ้งเตือนก่อนเริ่มการทำงานใหม่
  function hideImportMessages() {
    if (errorAlert) errorAlert.classList.add("d-none");
    if (statusBox) statusBox.classList.add("d-none");
  }

  // ล้าง Preview และยกเลิกข้อมูลที่ผ่านการตรวจสอบไว้เมื่อ Input เปลี่ยน
  function resetImportPreview() {
    verifiedItemData = null;
    if (btnImport) btnImport.disabled = true;
    if (previewBox) previewBox.classList.add("d-none");
  }

  // อ่านไฟล์ JSON แล้วใส่ข้อความลง Textarea; ใช้ Validation ชุดเดียวกับการวางข้อความ
  function readJsonFile(file) {
    hideImportMessages();
    resetImportPreview();

    const fileError = validateJsonFileMeta(file);
    if (fileError) {
      showImportError(fileError);
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      if (textarea) {
        textarea.value = String(event.target.result || "");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    reader.onerror = () => showImportError("อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    reader.readAsText(file);
  }

  // ตรวจ JSON และ ID ซ้ำสำหรับ Preview โดยยังไม่บันทึกข้อมูล
  function validateImportPreview() {
    hideImportMessages();
    resetImportPreview();

    const portfolioId = targetPortSelect?.value || "";
    if (!portfolioId) {
      showImportError("กรุณาเลือก Portfolio ปลายทางก่อนตรวจสอบ");
      return null;
    }

    const rawText = textarea?.value || "";
    const validation = validatePortfolioItemJson(rawText);
    if (!validation.valid) {
      showImportError(validation.errors.join(" | "));
      return null;
    }

    try {
      const portfolios = JSON.parse(localStorage.getItem(PORTFOLIOS_KEY) || "[]");
      const target = Array.isArray(portfolios)
        ? portfolios.find(portfolio => portfolio.portfolioId === portfolioId)
        : null;

      if (!target) {
        showImportError("ไม่พบ Portfolio ปลายทางในข้อมูลที่บันทึกไว้");
        return null;
      }

      const existingItems = Array.isArray(target.items) ? target.items : [];
      if (existingItems.some(item => item.id === validation.data.id)) {
        showImportError(`ID "${validation.data.id}" ถูก Import ใน Portfolio นี้แล้ว ไม่สามารถ Import ซ้ำได้`);
        return null;
      }
    } catch {
      showImportError("อ่านข้อมูล Portfolio ใน Local Storage ไม่สำเร็จ");
      return null;
    }

    return validation.data;
  }

  // ดาวน์โหลด JSON ตัวอย่างตามโครงสร้าง Portfolio Item โดยตรง
  if (btnDownloadSample) {
    btnDownloadSample.addEventListener("click", () => {
      const sampleItem = {
        id: "item-sample-999",
        title: "Sample Portfolio Item",
        type: "Course Assignment",
        date: "2026-11-18",
        role: "Developer",
        description: "ตัวอย่างรายละเอียดผลงานสำหรับการทดสอบระบบ Import",
        skills: ["JavaScript", "Bootstrap 5", "JSON"],
        reflection: {
          whatIDid: "พัฒนาฟังก์ชันนำเข้าข้อมูลผลงาน",
          whatILearned: "เรียนรู้การตรวจสอบโครงสร้าง JSON",
          challenge: "ตรวจสอบข้อมูลและป้องกัน ID ซ้ำ",
          nextStep: "พัฒนาระบบ Reflection และ Evidence ต่อ"
        },
        evidence: ["https://github.com/example/repo"]
      };

      const blob = new Blob([JSON.stringify(sampleItem, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sample-portfolio-item.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  // เปิดส่วน Import จากปุ่มใน Portfolio Items
  btnOpenImport?.addEventListener("click", () => {
    $("import-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // เลือกไฟล์จากเครื่อง
  fileInput?.addEventListener("change", event => readJsonFile(event.target.files?.[0]));

  // รองรับ Drag & Drop ไฟล์ JSON
  if (dropZone) {
    dropZone.addEventListener("dragover", event => {
      event.preventDefault();
      dropZone.classList.add("border-primary");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("border-primary"));
    dropZone.addEventListener("drop", event => {
      event.preventDefault();
      dropZone.classList.remove("border-primary");
      readJsonFile(event.dataTransfer?.files?.[0]);
    });
  }

  // ตรวจสอบข้อมูลและแสดง Preview ก่อน Import
  btnPreview?.addEventListener("click", () => {
    const item = validateImportPreview();
    if (!item) return;

    verifiedItemData = item;
    $("prev-id").textContent = item.id;
    $("prev-title").textContent = item.title;
    $("prev-type").textContent = item.type;
    $("prev-skills").textContent = item.skills.join(", ");
    previewBox?.classList.remove("d-none");
    if (btnImport) btnImport.disabled = false;
  });

  // ยืนยัน Import; importPortfolioItem จะ Validate และตรวจ ID ซ้ำอีกครั้งก่อนบันทึก
  function performImport() {
    if (!verifiedItemData) return;

    const portfolioId = targetPortSelect?.value || "";
    if (btnImport) btnImport.disabled = true;
    btnRetry?.classList.add("d-none");
    showImportStatus("กำลังบันทึกข้อมูลลง Local Storage...", "alert-info");

    const result = importPortfolioItem(textarea?.value || "", portfolioId);
    if (!result.success) {
      showImportStatus(result.error, "alert-danger");
      if (btnImport) btnImport.disabled = false;
      btnRetry?.classList.remove("d-none");
      return;
    }

    verifiedItemData = null;
    if (previewBox) previewBox.classList.add("d-none");
    showImportStatus(`Import Item ID: ${result.item.id} สำเร็จแล้ว`, "alert-success");
    if (btnImport) btnImport.disabled = true;
    if (textarea) textarea.value = "";
    if (fileInput) fileInput.value = "";
  }

  btnImport?.addEventListener("click", performImport);
  btnRetry?.addEventListener("click", performImport);

  // เปลี่ยน Portfolio หรือแก้ JSON แล้วต้อง Preview ใหม่ทุกครั้ง
  targetPortSelect?.addEventListener("change", () => {
    hideImportMessages();
    resetImportPreview();
  });
  textarea?.addEventListener("input", () => {
    hideImportMessages();
    resetImportPreview();
  });
});


// ---------- EXPORT MY PORTFOLIO & SUBMISSION HELPER (Issue #26) ----------
document.addEventListener("DOMContentLoaded", () => {
  const exportPortSelect = document.getElementById("export-source-port");
  const chkImportedItem = document.getElementById("chk-imported-item");
  const chkReflection = document.getElementById("chk-reflection");
  const chkEvidence = document.getElementById("chk-evidence");
  const btnExportJson = document.getElementById("btn-export-json");
  const btnCopyJson = document.getElementById("btn-copy-json");
  const exportAlert = document.getElementById("export-status-alert");

  if (!exportPortSelect) return;

  let currentExportItem = null;

  // แสดงผล Checklist แต่ละข้อด้วยข้อความธรรมดา
  function updateChecklistItem(element, isPassed, text) {
    if (!element) return;
    element.className = isPassed ? "mb-1 text-success fw-semibold" : "mb-1 text-danger";
    element.textContent = `${isPassed ? "✓" : "✗"} ${text}`;
  }

  // ตรวจสอบ Item ที่ Import ใน Portfolio ที่เลือกจากข้อมูลหลักชุดเดียว
  function evaluatePortfolioChecklist(portfolioId) {
    exportAlert?.classList.add("d-none");
    currentExportItem = null;

    let portfolio = null;
    try {
      const portfolios = JSON.parse(localStorage.getItem(PORTFOLIOS_KEY) || "[]");
      portfolio = Array.isArray(portfolios)
        ? portfolios.find(item => item.portfolioId === portfolioId)
        : null;
    } catch {
      portfolio = null;
    }

    const importedItems = Array.isArray(portfolio?.items)
      ? portfolio.items.filter(item => Boolean(item.importStatus))
      : [];
    const hasImportedItem = importedItems.length > 0;
    const hasCompleteReflection = importedItems.some(item => {
      const reflection = item.reflection || {};
      return [reflection.whatIDid, reflection.whatILearned, reflection.challenge, reflection.nextStep]
        .every(value => typeof value === "string" && value.trim());
    });
    const hasEvidence = importedItems.some(item =>
      Array.isArray(item.evidence) && item.evidence.some(url => typeof url === "string" && url.trim())
    );

    updateChecklistItem(chkImportedItem, hasImportedItem, "มี Item จากเพื่อนต่างกลุ่มอย่างน้อย 1 รายการ");
    updateChecklistItem(chkReflection, hasCompleteReflection, "Item ที่นำเข้ามีข้อมูล Reflection ครบถ้วน");
    updateChecklistItem(chkEvidence, hasEvidence, "Item ที่นำเข้ามีหลักฐาน Evidence แนบอยู่");

    // Export เป็น Item โดยตรงให้ตรงกับรูปแบบ Import ที่ตกลงกัน
    currentExportItem = importedItems.find(item =>
      item.reflection &&
      [item.reflection.whatIDid, item.reflection.whatILearned, item.reflection.challenge, item.reflection.nextStep]
        .every(value => typeof value === "string" && value.trim()) &&
      Array.isArray(item.evidence) && item.evidence.some(url => typeof url === "string" && url.trim())
    ) || null;

    const allPassed = hasImportedItem && hasCompleteReflection && hasEvidence;
    if (btnExportJson) btnExportJson.disabled = !allPassed || !currentExportItem;
    if (btnCopyJson) btnCopyJson.disabled = !hasImportedItem || !currentExportItem;
  }

  // แสดงข้อความสถานะการ Export
  function showExportMessage(message) {
    if (!exportAlert) return;
    exportAlert.textContent = message;
    exportAlert.classList.remove("d-none");
  }

  // ดาวน์โหลด Portfolio Item JSON โดยไม่ห่อ Wrapper เพิ่ม
  function downloadExportItem() {
    if (!currentExportItem) return;
    const blob = new Blob([JSON.stringify(currentExportItem, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `portfolio-item-${currentExportItem.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showExportMessage("ดาวน์โหลด Portfolio Item JSON เรียบร้อยแล้ว");
  }

  // คัดลอก Portfolio Item JSON ไปยัง Clipboard
  async function copyExportItem() {
    if (!currentExportItem) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentExportItem, null, 2));
      showExportMessage("คัดลอก Portfolio Item JSON เรียบร้อยแล้ว");
    } catch {
      showExportMessage("ไม่สามารถคัดลอก JSON ได้ กรุณาใช้ปุ่ม Export แทน");
    }
  }

  exportPortSelect.addEventListener("change", event => evaluatePortfolioChecklist(event.target.value));
  btnExportJson?.addEventListener("click", downloadExportItem);
  btnCopyJson?.addEventListener("click", copyExportItem);
  evaluatePortfolioChecklist(exportPortSelect.value);

  // อัปเดต Checklist หลังมีการ Import Item สำเร็จ
  window.addEventListener("portfolio:item-imported", () => {
    evaluatePortfolioChecklist(exportPortSelect.value);
  });
});



// ---------- IMPORT TESTS ----------
// เรียก runPortfolioItemImportTests() ใน Browser Console เพื่อทดสอบ 6 กรณีหลัก
function runPortfolioItemImportTests() {
  const validItem = {
    id: "test-item-001",
    title: "Test Website",
    type: "Course Assignment",
    date: "2026-11-19",
    role: "Developer",
    description: "Test description",
    skills: ["HTML", "CSS"],
    reflection: {
      whatIDid: "",
      whatILearned: "",
      challenge: "",
      nextStep: ""
    },
    evidence: [],
    schemaVersion: "1.0",
    challengeId: "CH001",
    hostGroup: "Group A",
    category: "discover"
  };

  const makeStorage = (initial, shouldFail = false) => {
    const values = new Map(Object.entries(initial || {}));
    return {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => {
        if (shouldFail) throw new Error("Simulated Local Storage error");
        values.set(key, String(value));
      },
      removeItem: key => values.delete(key),
      dump: key => values.get(key)
    };
  };

  const portfolioData = [{ portfolioId: "portfolio-test", name: "Test", items: [] }];
  const validText = JSON.stringify(validItem);
  const duplicateStorage = makeStorage({
    portfolios: JSON.stringify([{ ...portfolioData[0], items: [{ ...validItem }] }])
  });
  const saveErrorStorage = makeStorage({ portfolios: JSON.stringify(portfolioData) }, true);

  const tests = [
    {
      name: "Valid Item",
      run: () => importPortfolioItem(validText, "portfolio-test", makeStorage({ portfolios: JSON.stringify(portfolioData) })).success
    },
    {
      name: "Duplicate ID",
      run: () => !importPortfolioItem(validText, "portfolio-test", duplicateStorage).success
    },
    {
      name: "Invalid JSON",
      run: () => !validatePortfolioItemJson("{ invalid json }").valid
    },
    {
      name: "Wrong file extension",
      run: () => Boolean(validateJsonFileMeta({ name: "item.txt", size: 10 }))
    },
    {
      name: "File too large",
      run: () => Boolean(validateJsonFileMeta({ name: "item.json", size: IMPORT_MAX_BYTES + 1 }))
    },
    {
      name: "Local Storage save error keeps original data",
      run: () => {
        const before = saveErrorStorage.dump("portfolios");
        const result = importPortfolioItem(validText, "portfolio-test", saveErrorStorage);
        return !result.success && saveErrorStorage.dump("portfolios") === before;
      }
    }
  ];

  const results = tests.map(test => {
    let passed = false;
    try { passed = Boolean(test.run()); } catch (error) { console.error(error); }
    return { Test: test.name, Passed: passed };
  });
  console.table(results);
  return results.every(result => result.Passed);
}

// เปิดให้เรียกชุดทดสอบจาก Browser Console
if (typeof window !== "undefined") {
  window.runPortfolioItemImportTests = runPortfolioItemImportTests;
}
