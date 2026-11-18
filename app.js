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

    const errors = validatePortfolioItemData(newItem);
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


// === โค้ดระบบ Import Portfolio Item (Issue #25) ===
document.addEventListener('DOMContentLoaded', () => {
  const targetPortSelect = document.getElementById('import-target-port');
  const btnDownloadSample = document.getElementById('btn-download-sample');
  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('import-file-input');
  const textarea = document.getElementById('import-textarea');
  const errorAlert = document.getElementById('import-error-alert');
  const previewBox = document.getElementById('import-preview-box');
  const statusBox = document.getElementById('import-status-box');
  const statusText = document.getElementById('import-status-text');
  const btnRetry = document.getElementById('btn-retry-import');
  const btnPreview = document.getElementById('btn-preview-json');
  const btnImport = document.getElementById('btn-confirm-import');

  let verifiedItemData = null;

  // 1. ปุ่มดาวน์โหลดไฟล์ตัวอย่าง
  if (btnDownloadSample) {
    btnDownloadSample.addEventListener('click', () => {
      const sampleItem = {
        id: "item-sample-999",
        title: "Sample Portfolio Item",
        type: "Course Assignment",
        date: "2026-11-18",
        role: "Developer",
        description: "ตัวอย่างรายละเอียดผลงานสำหรับการทดสอบระบบ Import",
        skills: ["JavaScript", "Bootstrap 5", "JSON Schema"],
        reflection: {
          whatIDid: "พัฒนาฟังก์ชันนำเข้าข้อมูลผลงาน",
          whatILearned: "การตรวจสอบโครงสร้าง JSON และการจัดการ Error",
          challenge: "การป้องกันช่องโหว่ XSS และการตรวจสอบข้อมูลซ้ำ",
          nextStep: "เชื่อมโยงกับระบบ Reflection"
        },
        evidence: ["https://github.com/example/repo"]
      };

      const blob = new Blob([JSON.stringify(sampleItem, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample-item.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // 2. ฟังก์ชันอ่านไฟล์ .json ที่อัปโหลดหรือลากมาวาง
  function handleFile(file) {
    hideMessages();
    if (!file) return;
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      showError('กรุณาเลือกไฟล์นามสกุล .json เท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (textarea) textarea.value = e.target.result;
      if (btnImport) btnImport.disabled = true;
    };
    reader.onerror = () => showError('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    reader.readAsText(file);
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-primary'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-primary');
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
  }

  // 3. ฟังก์ชันตรวจสอบ JSON และ Schema

  function validateJSONInput() {
    hideMessages();
    if (btnImport) btnImport.disabled = true;
    verifiedItemData = null;

    const portfolioId = targetPortSelect ? targetPortSelect.value : '';
    if (!portfolioId) {
      showError('กรุณาเลือก Portfolio ปลายทางก่อนตรวจสอบ');
      return null;
    }

    const rawText = textarea ? textarea.value.trim() : '';
    if (!rawText) {
      showError('กรุณาวาง JSON หรืออัปโหลดไฟล์');
      return null;
    }

    // ตรวจสอบ JSON Wrapper ด้วย Issue #27
    const result = validatePortfolioItemJson(rawText);

    if (!result.valid) {
      showError(result.errors.join(' | '));
      return null;
    }

    const wrapper = result.data;
    const item = wrapper.item;

    // ตรวจสอบข้อมูลซ้ำใน Portfolio ปลายทาง
    const storageKey = `portfolio_${portfolioId}_items`;
    const existingItems = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (existingItems.some(existing => existing.id === item.id)) {
      showError(`Item นี้ (id: "${item.id}") ถูก import แล้ว`);
      return null;
    }

    // ตรวจสอบ exchangeId ซ้ำ
    if (existingItems.some(existing => existing.exchangeId === wrapper.exchangeId)) {
      showError(`exchangeId "${wrapper.exchangeId}" ถูกใช้งานแล้ว`);
      return null;
    }

    // เก็บ exchangeId ไว้กับ Item เพื่อใช้ตรวจสอบในครั้งต่อไป
    return {
      ...item,
      exchangeId: wrapper.exchangeId
    };
  }

  // 4. ปุ่ม Preview (ใช้ textContent ป้องกัน XSS)
  if (btnPreview) {
    btnPreview.addEventListener('click', () => {
      const validItem = validateJSONInput();
      if (!validItem) return;

      verifiedItemData = validItem;
      document.getElementById('prev-id').textContent = validItem.id;
      document.getElementById('prev-title').textContent = validItem.title;
      document.getElementById('prev-type').textContent = validItem.type || 'N/A';
      document.getElementById('prev-skills').textContent = validItem.skills.join(', ');

      if (previewBox) previewBox.classList.remove('d-none');
      if (btnImport) btnImport.disabled = false;
    });
  }

  // 5. ปุ่มยืนยัน Import
  async function performImport() {
    if (!verifiedItemData) return;
    const portfolioId = targetPortSelect ? targetPortSelect.value : '';

    if (btnImport) btnImport.disabled = true;
    if (btnRetry) btnRetry.classList.add('d-none');
    showStatus('กำลังบันทึกข้อมูลลงระบบ...', 'alert-info');

    try {
      await new Promise(res => setTimeout(res, 700));

      const storageKey = `portfolio_${portfolioId}_items`;
      const existingItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingItems.push(verifiedItemData);
      localStorage.setItem(storageKey, JSON.stringify(existingItems));

      showStatus('Import สำเร็จ! กำลังพาไปยังหน้า Reflection / Evidence...', 'alert-success');

      setTimeout(() => {
        window.location.href = `booth.html?portfolioId=${encodeURIComponent(portfolioId)}&itemId=${encodeURIComponent(verifiedItemData.id)}`;
      }, 1000);

    } catch (err) {
      showStatus('บันทึกล้มเหลว: ไม่สามารถบันทึกข้อมูลลงระบบได้', 'alert-danger');
      if (btnRetry) btnRetry.classList.remove('d-none');
    }
  }

  if (btnImport) btnImport.addEventListener('click', performImport);
  if (btnRetry) btnRetry.addEventListener('click', performImport);

  // ยกเลิก Preview เมื่อเปลี่ยน Portfolio ปลายทาง
  if (targetPortSelect) {
    targetPortSelect.addEventListener('change', () => {
      verifiedItemData = null;
      if (btnImport) btnImport.disabled = true;
      if (previewBox) previewBox.classList.add('d-none');
    });
  }

  if (textarea) {
    textarea.addEventListener('input', () => {
      verifiedItemData = null;
      if (btnImport) btnImport.disabled = true;
      if (previewBox) previewBox.classList.add('d-none');
    });
  }

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.classList.remove('d-none');
    }
    if (previewBox) previewBox.classList.add('d-none');
  }

  function showStatus(msg, alertClass) {
    if (statusBox && statusText) {
      statusBox.className = `alert ${alertClass} py-2 px-3 mb-3`;
      statusText.textContent = msg;
      statusBox.classList.remove('d-none');
    }
  }

  function hideMessages() {
    if (errorAlert) errorAlert.classList.add('d-none');
    if (statusBox) statusBox.classList.add('d-none');
  }
});

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