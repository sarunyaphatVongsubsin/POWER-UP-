"use strict";

// Portfolio data is stored on the PHP server; LocalStorage keeps only the selected Portfolio ID.
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
  return {
    id: data.id || "",
    title: data.title || "",
    type: data.type || "",
    date: data.date || "",
    role: data.role || "",
    description: data.description || "",
    skills: Array.isArray(data.skills) ? [...data.skills] : [],
    reflection: createReflection(data.reflection),
    evidence: Array.isArray(data.evidence) ? [...data.evidence] : [],
    // Optional metadata จาก Challenge/Import เก็บไว้ แม้หน้า Portfolio ไม่ได้แสดงผล
    ...(typeof data.challengeId === "string" ? { challengeId: data.challengeId } : {}),
    ...(typeof data.hostGroup === "string" ? { hostGroup: data.hostGroup } : {}),
    ...(typeof data.category === "string" ? { category: data.category } : {}),
    ...(typeof data.exchangeId === "string" ? { exchangeId: data.exchangeId } : {}),
    ...(typeof data.issuedAt === "string" ? { issuedAt: data.issuedAt } : {}),
    ...(typeof data.schemaVersion === "string" ? { schemaVersion: data.schemaVersion } : {}),
    ...(typeof data.importStatus === "string" ? { importStatus: data.importStatus } : {}),
    ...(typeof data.updatedAt === "string" ? { updatedAt: data.updatedAt } : {})
  };
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
      validatePortfolioItemData(item).forEach(error =>
        errors.push(`Item ${index + 1}: ${error}`)
      )
    );
  }
  return errors;
}

// ตรวจสอบข้อมูล Item รวมถึงวันที่ Skills, Reflection และ Evidence
function validatePortfolioItemData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    return ["Portfolio item must be an object"];

  const errors = [];
  ["id", "title", "type", "date", "role", "description"].forEach(field => {
    if (typeof data[field] !== "string" || !data[field].trim())
      errors.push(`${field} is required`);
  });

  // ตรวจสอบวันที่จริงในรูปแบบ YYYY-MM-DD
  if (typeof data.date === "string" && data.date.trim()) {
    const date = new Date(data.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== data.date) {
      errors.push("Date must be a valid YYYY-MM-DD date");
    }
  }

  if (!Array.isArray(data.skills) ||
      !data.skills.every(skill => typeof skill === "string"))
    errors.push("Skills must be an array of strings");

  if (!data.reflection || typeof data.reflection !== "object" ||
      Array.isArray(data.reflection)) {
    errors.push("Reflection must be an object");
  } else {
    ["whatIDid", "whatILearned", "challenge", "nextStep"].forEach(field => {
      if (typeof data.reflection[field] !== "string")
        errors.push(`Reflection ${field} must be a string`);
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
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname)
          errors.push(`Invalid Evidence URL: ${url}`);
      } catch {
        errors.push(`Invalid Evidence URL: ${url}`);
      }
    });
  }
  return errors;
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

// ---------- SERVER API ----------

// เรียก PHP API และแปลงข้อผิดพลาดจาก Server เป็น Error ที่อ่านได้
async function callPortfolioApi(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

// โหลดข้อมูล Portfolio ทั้งหมดจาก Server เท่านั้น
async function loadPortfoliosFromServer() {
  const data = await callPortfolioApi("api/portfolios.php");
  if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลจาก Server ไม่ถูกต้อง");
  return data.map(createPortfolio);
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

// แสดงช่องกรอกรหัสผ่านแบบซ่อนตัวอักษร และคืน null เมื่อยกเลิก
function requestDeletePassword() {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    const box = document.createElement("div");
    box.className = "confirm-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    const title = document.createElement("h3");
    title.className = "confirm-title";
    title.textContent = "ยืนยันรหัสผ่านสำหรับการลบ";
    const input = document.createElement("input");
    input.type = "password";
    input.className = "form-control my-3";
    input.placeholder = "กรอกรหัสผ่าน";
    input.autocomplete = "current-password";
    const actions = document.createElement("div");
    actions.className = "confirm-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-confirm-cancel";
    cancel.textContent = "ยกเลิก";
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "btn-confirm-ok";
    submit.textContent = "ยืนยันการลบ";
    function close(value) { overlay.remove(); resolve(value); }
    cancel.addEventListener("click", () => close(null));
    submit.addEventListener("click", () => close(input.value));
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") close(input.value);
      if (event.key === "Escape") close(null);
    });
    actions.append(cancel, submit);
    box.append(title, input, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    input.focus();
  });
}

// แยกข้อความที่คั่นด้วย comma หรือขึ้นบรรทัดใหม่เป็น Array
function splitList(text) {
  return text.split(/[,\n]/).map(value => value.trim()).filter(Boolean);
}

// สร้างหน้าต่างแก้ไขข้อมูลแบบใช้ร่วมกัน โดยคืนค่า null เมื่อยกเลิก
function openEditModal(title, fields, initialValues) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "edit-modal-overlay";
    const box = document.createElement("div");
    box.className = "edit-modal-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    const heading = document.createElement("h3");
    heading.textContent = title;
    const form = document.createElement("form");
    form.noValidate = true;
    const grid = document.createElement("div");
    grid.className = "row g-3";

    fields.forEach(field => {
      const column = document.createElement("div");
      column.className = field.wide ? "col-12" : "col-md-6";
      const label = document.createElement("label");
      label.className = "form-label fw-semibold";
      label.textContent = field.label;
      label.htmlFor = `edit-${field.id}`;
      const input = document.createElement(field.type === "textarea" ? "textarea" : "input");
      input.id = `edit-${field.id}`;
      input.name = field.id;
      input.className = "form-control";
      if (field.type === "textarea") input.rows = field.rows || 3;
      else input.type = field.type || "text";
      input.required = Boolean(field.required);
      input.value = initialValues[field.id] ?? "";
      column.append(label, input);
      grid.appendChild(column);
    });

    const actions = document.createElement("div");
    actions.className = "edit-modal-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn-outline-secondary";
    cancel.textContent = "Cancel";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "btn btn-accent";
    save.textContent = "Save Changes";
    actions.append(cancel, save);
    form.append(grid, actions);
    box.append(heading, form);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close(value) {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(value);
    }
    function onKeydown(event) {
      if (event.key === "Escape") close(null);
    }
    cancel.addEventListener("click", () => close(null));
    overlay.addEventListener("click", event => {
      if (event.target === overlay) close(null);
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const values = {};
      let valid = true;
      fields.forEach(field => {
        const input = form.elements[field.id];
        values[field.id] = input.value.trim();
        if (field.required && !values[field.id]) {
          input.classList.add("is-invalid");
          valid = false;
        } else input.classList.remove("is-invalid");
      });
      if (valid) close(values);
    });
    document.addEventListener("keydown", onKeydown);
    form.querySelector("input, textarea")?.focus();
  });
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

  // โหลด Portfolio จาก PHP API; ข้อมูลจริงถูกเก็บในไฟล์ JSON บน Server
  let portfolios = [];

  // Public refresh hook used by the single Import Modal workflow.
  // Keep the current Portfolio ID while reloading authoritative Server data.
  window.refreshPortfolioData = async function refreshPortfolioData() {
    const selectedPortfolioId = localStorage.getItem(CURRENT_ID_KEY);
    portfolios = await loadPortfoliosFromServer();

    if (selectedPortfolioId && portfolios.some(p => p.portfolioId === selectedPortfolioId)) {
      localStorage.setItem(CURRENT_ID_KEY, selectedPortfolioId);
    } else if (portfolios.length) {
      localStorage.setItem(CURRENT_ID_KEY, portfolios[0].portfolioId);
    } else {
      localStorage.removeItem(CURRENT_ID_KEY);
    }

    renderAll();
    return portfolios;
  };

  try {
    portfolios = await loadPortfoliosFromServer();
  } catch (error) {
    console.error(error);
    showStatus(`โหลดข้อมูลจาก Server ไม่สำเร็จ: ${error.message}`, "danger");
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
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-edit-item btn-sm";
      editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';
      editButton.addEventListener("click", () => editPortfolioItem(item.id));
      footer.append(editButton, deleteButton);

      card.append(top, title, role, description, skills,
        reflectionEl, evidenceLabel, evidenceList, footer);
      itemsListEl.appendChild(card);
    });
  }

  // แก้ไขข้อมูล Profile ของ Portfolio ที่เลือก โดยอัปเดต record เดิมบน Server
  async function editCurrentProfile() {
    const target = getCurrentPortfolio();
    if (!target) return;
    const values = await openEditModal("Edit Profile", [
      { id: "name", label: "Display Name", required: true, wide: true },
      { id: "whatIEnjoy", label: "What I Enjoy", type: "textarea", required: true },
      { id: "whatIveTried", label: "What I've Tried", type: "textarea", required: true },
      { id: "whatImCuriousAbout", label: "What I'm Curious About", type: "textarea", required: true }
    ], target);
    if (!values) return;

    const formData = new FormData();
    formData.append("portfolioId", target.portfolioId);
    Object.entries(values).forEach(([key, value]) => formData.append(key, value));
    try {
      const updated = await callPortfolioApi("api/update-portfolio.php", { method: "POST", body: formData });
      Object.assign(target, updated);
      renderAll();
      showStatus("อัปเดต Profile เรียบร้อยแล้ว!");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  }

  // แก้ไข Item ด้วย ID เดิม จึงไม่สร้างรายการซ้ำ
  async function editPortfolioItem(itemId) {
    const target = getCurrentPortfolio();
    const item = target?.items?.find(entry => entry.id === itemId);
    if (!target || !item) return;
    const reflection = item.reflection || {};
    const values = await openEditModal("Edit Portfolio Item", [
      { id: "title", label: "Title", required: true, wide: true },
      { id: "type", label: "Type", required: true },
      { id: "date", label: "Date", type: "date", required: true },
      { id: "role", label: "Role", required: true, wide: true },
      { id: "skills", label: "Skills (คั่นด้วย comma)", required: true, wide: true },
      { id: "description", label: "Description", type: "textarea", required: true, wide: true },
      { id: "whatIDid", label: "What I did", type: "textarea", required: true },
      { id: "whatILearned", label: "What I learned", type: "textarea", required: true },
      { id: "challenge", label: "Challenge", type: "textarea", required: true },
      { id: "nextStep", label: "Next step", type: "textarea", required: true },
      { id: "evidence", label: "Evidence (หนึ่ง URL ต่อบรรทัด)", type: "textarea", required: true, wide: true }
    ], {
      title: item.title, type: item.type, date: item.date, role: item.role,
      skills: (item.skills || []).join(", "), description: item.description,
      whatIDid: reflection.whatIDid, whatILearned: reflection.whatILearned,
      challenge: reflection.challenge, nextStep: reflection.nextStep,
      evidence: (item.evidence || []).join("\\n")
    });
    if (!values) return;

    const updatedItem = {
      ...item,
      title: values.title, type: values.type, date: values.date, role: values.role,
      skills: splitList(values.skills),
      description: values.description,
      reflection: {
        whatIDid: values.whatIDid, whatILearned: values.whatILearned,
        challenge: values.challenge, nextStep: values.nextStep
      },
      evidence: values.evidence.split(/[\\r\\n]+/).map(value => value.trim()).filter(Boolean)
    };
    const errors = validatePortfolioItemData(updatedItem);
    if (errors.length) return showStatus(errors[0], "danger");

    const formData = new FormData();
    formData.append("portfolioId", target.portfolioId);
    formData.append("itemId", item.id);
    formData.append("title", updatedItem.title);
    formData.append("type", updatedItem.type);
    formData.append("date", updatedItem.date);
    formData.append("role", updatedItem.role);
    formData.append("description", updatedItem.description);
    formData.append("skills", updatedItem.skills.join(","));
    formData.append("whatIDid", updatedItem.reflection.whatIDid);
    formData.append("whatILearned", updatedItem.reflection.whatILearned);
    formData.append("challenge", updatedItem.reflection.challenge);
    formData.append("nextStep", updatedItem.reflection.nextStep);
    formData.append("evidence", updatedItem.evidence.join("\\n"));
    try {
      const saved = await callPortfolioApi("api/update-item.php", { method: "POST", body: formData });
      const index = target.items.findIndex(entry => entry.id === item.id);
      if (index !== -1) target.items[index] = createPortfolioItem(saved);
      renderPortfolioView(target);
      showStatus("อัปเดต Portfolio Item เรียบร้อยแล้ว!");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  }

  $("btn-edit-profile")?.addEventListener("click", editCurrentProfile);

  // ลบ Item หลังยืนยัน แล้วบันทึกและแสดงข้อมูลใหม่
  async function deleteItem(itemId) {
    const target = getCurrentPortfolio();
    if (!target) return;

    const confirmed = await confirmDialog(
      "ต้องการลบ Item นี้ใช่หรือไม่? ระบบจะขอรหัสผ่านก่อนลบ และไม่สามารถย้อนกลับได้",
      { title: "ลบ Item", confirmText: "ดำเนินการต่อ" }
    );
    if (!confirmed) return;

    // รับรหัสผ่านจากผู้ใช้แล้วส่งให้ PHP ตรวจสอบ (ไม่ตรวจสอบรหัสผ่านใน JavaScript)
    const password = await requestDeletePassword();
    if (password === null) return;

    try {
      const formData = new FormData();
      formData.append("portfolioId", target.portfolioId);
      formData.append("itemId", itemId);
      formData.append("password", password);
      await callPortfolioApi("api/delete.php", { method: "POST", body: formData });
      target.items = (target.items || []).filter(item => item.id !== itemId);
      renderPortfolioView(target);
      showStatus("ลบ Item เรียบร้อยแล้ว!");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  }

  // อัปเดตข้อมูลภาพรวมและจำนวน Item
  function renderPortfolioView(portfolio) {
    const current = portfolio || {};
    const profileNameEl = $("profile-name");
    if (profileNameEl) profileNameEl.textContent = portfolio ? portfolio.name : "เลือก Portfolio";
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
    const profileNameEl = $("profile-name");
    const deletePortfolioButton = $("btn-delete-portfolio");
    const editProfileButton = $("btn-edit-profile");
    if (profileNameEl) profileNameEl.textContent = current ? current.name : "เลือก Portfolio";
    if (deletePortfolioButton) deletePortfolioButton.disabled = !current;
    if (editProfileButton) editProfileButton.disabled = !current;
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

  // ลบ Portfolio ทั้งชุด (รวม Items และ Reflection) หลัง PHP ตรวจสอบรหัสผ่าน
  $("btn-delete-portfolio")?.addEventListener("click", async () => {
    const target = getCurrentPortfolio();
    if (!target) return;
    const confirmed = await confirmDialog(
      `ต้องการลบ Portfolio \"${target.name}\" และ Item ทั้งหมดใช่หรือไม่?`,
      { title: "ลบ Portfolio", confirmText: "ดำเนินการต่อ" }
    );
    if (!confirmed) return;
    const password = await requestDeletePassword();
    if (password === null) return;

    try {
      const formData = new FormData();
      formData.append("portfolioId", target.portfolioId);
      formData.append("password", password);
      await callPortfolioApi("api/delete.php", { method: "POST", body: formData });
      portfolios = portfolios.filter(portfolio => portfolio.portfolioId !== target.portfolioId);
      renderAll();
      showStatus("ลบ Portfolio เรียบร้อยแล้ว!");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  });

  // เมื่อเปลี่ยน Dropdown ให้บันทึก ID และแสดง Portfolio ใหม่
  portfolioSelectEl?.addEventListener("change", event => {
    localStorage.setItem(CURRENT_ID_KEY, event.target.value);
    renderPortfolioView(getCurrentPortfolio());
  });

  // Reset ข้อมูลบน Server กลับเป็น Portfolio ตัวอย่าง โดยต้องยืนยันและใส่รหัสผ่านก่อน
  async function resetServerData() {
    const confirmed = await confirmDialog(
      "การ Reset จะเขียนทับข้อมูล Portfolio ทั้งหมดบน Server และคืนเป็นข้อมูลตัวอย่างเดิม ต้องการดำเนินการต่อหรือไม่?",
      { title: "Reset Data", confirmText: "ดำเนินการต่อ" }
    );
    if (!confirmed) return;

    // ขอรหัสผ่านแล้วส่งให้ PHP ตรวจสอบ ห้ามตรวจสอบรหัสผ่านใน JavaScript
    const password = await requestDeletePassword();
    if (password === null) return;

    try {
      const formData = new FormData();
      formData.append("password", password);
      const result = await callPortfolioApi("api/reset.php", {
        method: "POST",
        body: formData
      });

      // แทนข้อมูลในหน่วยความจำด้วยข้อมูลล่าสุดที่ PHP ส่งกลับมา
      portfolios = Array.isArray(result.portfolios)
        ? result.portfolios.map(createPortfolio)
        : await loadPortfoliosFromServer();
      renderAll();
      showStatus(result.message || "Reset ข้อมูลเรียบร้อยแล้ว!");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  }

  // ปุ่ม Reset บน Desktop และ Mobile ใช้ฟังก์ชัน PHP เดียวกัน
  $("btn-reset-data")?.addEventListener("click", resetServerData);
  document.querySelector(".mobile-reset .btn-reset")?.addEventListener("click", resetServerData);

  // ฟอร์มสร้าง Portfolio ใหม่
  const portfolioForm = $("portfolio-form");
  portfolioForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!portfolioForm.checkValidity()) {
      event.stopPropagation();
      portfolioForm.classList.add("was-validated");
      return;
    }

    // ส่งข้อมูล Portfolio ไปให้ PHP สร้าง ID และบันทึกลง JSON บน Server
    const formData = new FormData();
    formData.append("name", $("p-name").value.trim());
    formData.append("whatIEnjoy", $("p-enjoy").value.trim());
    formData.append("whatIveTried", $("p-tried").value.trim());
    formData.append("whatImCuriousAbout", $("p-curious").value.trim());

    try {
      const savedPortfolio = createPortfolio(await callPortfolioApi("api/portfolios.php", { method: "POST", body: formData }));
      portfolios.push(savedPortfolio);
      localStorage.setItem(CURRENT_ID_KEY, savedPortfolio.portfolioId);
      renderAll();
      showStatus("บันทึกข้อมูล Portfolio บน Server สำเร็จแล้ว!");
      portfolioForm.reset();
      portfolioForm.classList.remove("was-validated");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  });

  // ฟอร์มเพิ่ม Item ใน Portfolio ที่เลือก
  const itemForm = $("item-form");
  itemForm?.addEventListener("submit", async event => {
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

    const errors = validatePortfolioItemData(newItem);
    if (errors.length) return showStatus(errors[0], "danger");

    // ส่งข้อมูล Item และ Reflection ไปบันทึกภายใน Portfolio บน Server
    const formData = new FormData();
    formData.append("portfolioId", target.portfolioId);
    formData.append("title", newItem.title);
    formData.append("type", newItem.type);
    formData.append("date", newItem.date);
    formData.append("role", newItem.role);
    formData.append("description", newItem.description);
    formData.append("skills", newItem.skills.join(","));
    formData.append("whatIDid", newItem.reflection.whatIDid);
    formData.append("whatILearned", newItem.reflection.whatILearned);
    formData.append("challenge", newItem.reflection.challenge);
    formData.append("nextStep", newItem.reflection.nextStep);
    formData.append("evidence", newItem.evidence.join("\n"));

    try {
      const savedItem = createPortfolioItem(await callPortfolioApi("api/items.php", { method: "POST", body: formData }));
      if (!Array.isArray(target.items)) target.items = [];
      target.items.push(savedItem);
      renderPortfolioView(target);
      showStatus("บันทึก Portfolio Item บน Server สำเร็จแล้ว!");
      itemForm.reset();
      itemForm.classList.remove("was-validated");
    } catch (error) {
      showStatus(error.message, "danger");
    }
  });
}

// เริ่มทำงานเมื่อ HTML โหลด DOM เสร็จ
document.addEventListener("DOMContentLoaded", initializeApp);


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


// Import Modal workflow is owned exclusively by js/portfolio-transfer.js.

// === โค้ดระบบ Export My Portfolio & Submission Helper (Issue #26) ===
document.addEventListener('DOMContentLoaded', () => {
  const exportPortSelect = document.getElementById('export-source-port');
  const chkImportedItem = document.getElementById('chk-imported-item');
  const chkReflection = document.getElementById('chk-reflection');
  const chkEvidence = document.getElementById('chk-evidence');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnCopyJson = document.getElementById('btn-copy-json');
  const exportAlert = document.getElementById('export-status-alert');

  let currentExportPayload = null;

  // ข้อมูลพื้นฐานของ Portfolio (อ้างอิงจากโครงสร้างไฟล์ตัวอย่างของกลุ่ม)
  const basePortfolios = {
    'portfolio-1': {
      portfolioId: 'portfolio-1',
      name: 'Napat Wattanapong (Ploy)',
      whatIEnjoy: 'Designing user-friendly web interfaces, building interactive frontend applications, and collaborating on creative student tech projects.',
      whatIveTried: 'HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, Git/GitHub workflow, and Figma UI prototyping.',
      whatImCuriousAbout: 'React.js, TypeScript, accessible web design (WCAG), and full-stack development with Node.js.'
    },
    'portfolio-2': {
      portfolioId: 'portfolio-2',
      name: 'Thanawat Srisuk (Ton)',
      whatIEnjoy: 'Solving algorithmic problems, automating repetitive workflows with Python, and exploring data visualization.',
      whatIveTried: 'Python scripting, C programming, basic SQL queries, data cleaning with Pandas, and command-line Git.',
      whatImCuriousAbout: 'Machine learning fundamentals, RESTful API design, Docker containers, and cloud deployment.'
    }
  };

  function updateChecklistItem(element, isPassed, text) {
    if (!element) return;
    element.className = isPassed ? 'mb-1 text-success fw-semibold' : 'mb-1 text-danger';
    element.textContent = `${isPassed ? '✓' : '✗'} ${text}`;
  }

  function evaluatePortfolioChecklist(portfolioId) {
    if (exportAlert) exportAlert.classList.add('d-none');
    currentExportPayload = null;

    if (!portfolioId || !basePortfolios[portfolioId]) {
      updateChecklistItem(chkImportedItem, false, 'มี Item จากเพื่อนต่างกลุ่มอย่างน้อย 1 รายการ');
      updateChecklistItem(chkReflection, false, 'Item ที่นำเข้ามีข้อมูล Reflection ครบถ้วน');
      updateChecklistItem(chkEvidence, false, 'Item ที่นำเข้ามีหลักฐาน Evidence แนบอยู่');
      if (btnExportJson) btnExportJson.disabled = true;
      if (btnCopyJson) btnCopyJson.disabled = true;
      return;
    }

    // ดึงรายการ Item ที่ถูก Import เก็บไว้ใน localStorage (จาก Issue #25)
    const storageKey = `portfolio_${portfolioId}_items`;
    const importedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');

    // 1. เช็คว่ามี Item อย่างน้อย 1 รายการหรือไม่
    const hasImportedItem = importedItems.length >= 1;

    // 2. เช็คว่า Item มี Reflection ครบหรือไม่
    const hasCompleteReflection = hasImportedItem && importedItems.some(item => {
      const r = item.reflection;
      return r && r.whatIDid && r.whatILearned && r.challenge && r.nextStep;
    });

    // 3. เช็คว่า Item มี Evidence หรือไม่
    const hasEvidence = hasImportedItem && importedItems.some(item => {
      return Array.isArray(item.evidence) && item.evidence.length > 0;
    });

    updateChecklistItem(chkImportedItem, hasImportedItem, 'มี Item จากเพื่อนต่างกลุ่มอย่างน้อย 1 รายการ');
    updateChecklistItem(chkReflection, hasCompleteReflection, 'Item ที่นำเข้ามีข้อมูล Reflection ครบถ้วน');
    updateChecklistItem(chkEvidence, hasEvidence, 'Item ที่นำเข้ามีหลักฐาน Evidence แนบอยู่');

    const isAllPassed = hasImportedItem && hasCompleteReflection && hasEvidence;

    // เตรียมข้อมูลสำหรับ Export
    currentExportPayload = {
      ...basePortfolios[portfolioId],
      exportedAt: new Date().toISOString(),
      items: importedItems
    };

    // เปิดใช้งานปุ่ม Export เมื่อผ่านเกณฑ์ครบ (ปุ่ม Copy เปิดให้ใช้สำรองได้เมื่อมีข้อมูล)
    if (btnExportJson) btnExportJson.disabled = !isAllPassed;
    if (btnCopyJson) btnCopyJson.disabled = !hasImportedItem;
  }

  if (exportPortSelect) {
    exportPortSelect.addEventListener('change', (e) => {
      evaluatePortfolioChecklist(e.target.value);
    });
  }

  // ปุ่ม Export ดาวน์โหลดไฟล์ชื่อ my-portfolio.json
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      if (!currentExportPayload) return;

      const jsonString = JSON.stringify(currentExportPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-portfolio.json';
      a.click();
      URL.revokeObjectURL(url);

      showExportMessage('ดาวน์โหลดไฟล์ my-portfolio.json เรียบร้อยแล้ว');
    });
  }

  // ปุ่ม Copy JSON สำรอง
  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', async () => {
      if (!currentExportPayload) return;

      const jsonString = JSON.stringify(currentExportPayload, null, 2);
      try {
        await navigator.clipboard.writeText(jsonString);
        showExportMessage('คัดลอกข้อมูล JSON ลงคลิปบอร์ดเรียบร้อยแล้ว');
      } catch (err) {
        showExportMessage('ไม่สามารถคัดลอกอัตโนมัติได้ กรุณากดปุ่ม Export แทน');
      }
    });
  }

  function showExportMessage(msg) {
    if (!exportAlert) return;
    exportAlert.textContent = msg;
    exportAlert.classList.remove('d-none');
  }
});