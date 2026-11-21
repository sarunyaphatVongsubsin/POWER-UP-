
/* POWER UP! Portfolio Import / Export
 * ใช้ PHP API เป็นแหล่งข้อมูลหลัก เพื่อให้ข้อมูลถาวรอยู่บน Server
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const API = "api/portfolios.php";

  // ---------- API Request ----------
  async function request(url, options = {}) {
    const response = await fetch(url, options);
    const raw = await response.text();

    let data;

    try {
      data = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      // PHP errors may be returned as HTML (for example <br><b>Warning</b>).
      const readable = raw
        .replace(/<br\s*\/?\s*>/gi, " ")
        .replace(/<\/?b>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&quot;/gi, '"')
        .replace(/&#039;|&apos;/gi, "'")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);

      const detail = readable || "Server ไม่ได้ส่ง JSON กลับมา";
      throw new Error(
        `Server ตอบกลับไม่ใช่ JSON (HTTP ${response.status}): ${detail}`
      );
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    if (data && data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  // ---------- แสดงข้อความแจ้งเตือน ----------
  function show(el, message, type = "danger") {
    if (!el) return;

    el.className = `alert alert-${type} py-2 px-3 mb-3`;
    el.textContent = message;
    el.classList.remove("d-none");
  }

  // ---------- ตรวจสอบวันที่ ----------
  // ตรวจสอบวันที่จริงรูปแบบ YYYY-MM-DD
  // โดยไม่ใช้ toISOString() เพื่อป้องกันปัญหา Timezone
  function isValidDate(value) {
    if (typeof value !== "string") return false;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  // ---------- ตรวจสอบ Portfolio Item หนึ่งรายการ ----------
  function validateSingleItem(item) {
    const errors = [];

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { valid: false, errors: ["ข้อมูลแต่ละรายการต้องเป็น Object"] };
    }

    ["id", "title", "type", "date", "role", "description"].forEach(key => {
      if (typeof item[key] !== "string" || !item[key].trim()) {
        errors.push(`${key} จำเป็นต้องมีข้อมูล`);
      }
    });

    if (typeof item.date === "string" && !isValidDate(item.date.trim())) {
      errors.push("date ต้องเป็นวันที่จริงรูปแบบ YYYY-MM-DD");
    }

    if (
      !Array.isArray(item.skills) ||
      item.skills.length > 20 ||
      !item.skills.every(x => typeof x === "string" && x.trim())
    ) {
      errors.push("skills ต้องเป็น Array ของข้อความ (ไม่เกิน 20 รายการ)");
    }

    if (
      !item.reflection ||
      typeof item.reflection !== "object" ||
      Array.isArray(item.reflection)
    ) {
      errors.push("reflection ต้องเป็น Object");
    } else {
      ["whatIDid", "whatILearned", "challenge", "nextStep"].forEach(key => {
        if (typeof item.reflection[key] !== "string") {
          errors.push(`reflection.${key} ต้องเป็นข้อความ`);
        }
      });
    }

    if (!Array.isArray(item.evidence) || item.evidence.length > 10) {
      errors.push("evidence ต้องเป็น Array (ไม่เกิน 10 รายการ)");
    } else {
      item.evidence.forEach((url, i) => {
        if (typeof url !== "string") {
          errors.push(`evidence[${i}] ต้องเป็นข้อความ`);
          return;
        }
        if (!url.trim()) return;
        try {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
            throw new Error();
          }
        } catch {
          errors.push(`evidence[${i}] ต้องเป็น HTTP/HTTPS URL`);
        }
      });
    }

    if (item.schemaVersion !== undefined && item.schemaVersion !== "1.0") {
      errors.push('schemaVersion หากระบุต้องเป็น "1.0"');
    }
    if (
      item.category !== undefined &&
      !["discover", "mix", "levelup"].includes(item.category)
    ) {
      errors.push("category ไม่ถูกต้อง");
    }
    ["challengeId", "hostGroup"].forEach(key => {
      if (
        item[key] !== undefined &&
        (typeof item[key] !== "string" || !item[key].trim() || item[key].length > 100)
      ) {
        errors.push(`${key} ไม่ถูกต้อง`);
      }
    });

    return { valid: errors.length === 0, errors, data: item };
  }

  // ---------- รองรับ Single Item, Array และ Full Portfolio ----------
  function validateItem(text) {
    if (typeof text !== "string" || !text.trim()) {
      return { valid: false, errors: ["กรุณาระบุ JSON"] };
    }
    if (new Blob([text]).size > 256 * 1024) {
      return { valid: false, errors: ["JSON ต้องมีขนาดไม่เกิน 256 KB"] };
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { valid: false, errors: ["JSON Syntax ไม่ถูกต้อง"] };
    }

    let candidates;
    if (Array.isArray(parsed)) {
      candidates = parsed;
    } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      // Full Portfolio: ใช้เฉพาะ items และละเว้นข้อมูลระดับ Portfolio
      candidates = parsed.items;
    } else if (parsed && typeof parsed === "object" && parsed.id !== undefined) {
      candidates = [parsed];
    } else {
      return {
        valid: false,
        errors: ["ไม่พบ Item: JSON ต้องเป็น Item, Array ของ Item หรือ Portfolio ที่มี items"]
      };
    }

    if (!candidates.length) {
      return { valid: false, errors: ["ไม่พบ Portfolio Item ในข้อมูลที่เลือก"] };
    }
    if (candidates.length > 100) {
      return { valid: false, errors: ["Import ได้สูงสุด 100 Items ต่อครั้ง"] };
    }

    const validItems = [];
    const errors = [];
    const seenIds = new Set();

    candidates.forEach((item, index) => {
      const result = validateSingleItem(item);
      if (!result.valid) {
        errors.push(`Item ลำดับที่ ${index + 1}: ${result.errors.join(", ")}`);
        return;
      }

      const id = result.data.id.trim();
      if (seenIds.has(id)) {
        errors.push(`Item ลำดับที่ ${index + 1}: ID "${id}" ซ้ำภายในไฟล์`);
        return;
      }
      seenIds.add(id);
      validItems.push({ ...result.data, id });
    });

    if (errors.length) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      data: validItems,
      count: validItems.length
    };
  }

  // ---------- เติมข้อมูลลง Select ----------
  function fillSelect(select, portfolios) {
    if (!select) return;

    const previous = select.value;

    select.innerHTML =
      '<option value="">กรุณาเลือก Portfolio</option>';

    portfolios.forEach(p => {
      const option = document.createElement("option");

      option.value = p.portfolioId;
      option.textContent = p.name;

      select.appendChild(option);
    });

    if (portfolios.some(p => p.portfolioId === previous)) {
      select.value = previous;
    }
  }

  // ---------- เริ่มต้นระบบ ----------
  async function init() {
    const targetSelect = $("import-target-port");
    const exportSelect = $("export-source-port");
    const textArea = $("import-textarea");
    const fileInput = $("import-file-input");
    const drop = $("import-drop-zone");

    const error = $("import-error-alert");
    const preview = $("import-preview-box");

    const status = $("import-status-box");
    const statusText = $("import-status-text");

    const previewButton = $("btn-preview-json");
    const importButton = $("btn-confirm-import");

    const exportButton = $("btn-export-json");
    const copyButton = $("btn-copy-json");

    const exportAlert = $("export-status-alert");
    const activePortfolioSelect = $("portfolio-select");
    const importModalEl = $("import-modal");
    const importModal = importModalEl && window.bootstrap ? bootstrap.Modal.getOrCreateInstance(importModalEl) : null;

    if (!targetSelect || !exportSelect) return;

    let portfolios = [];
    let verifiedItems = [];
    let exportPayload = "";
    let isImporting = false;

    // ---------- โหลด Portfolio จาก Server ----------
    try {
      portfolios = await request(API);

      fillSelect(targetSelect, portfolios);
      fillSelect(exportSelect, portfolios);
      syncImportTarget();

    } catch (e) {
      show(error, `โหลดรายชื่อ Portfolio ไม่สำเร็จ: ${e.message}`);
    }

    // ---------- ใช้ Portfolio ที่เปิดอยู่เป็นค่าเริ่มต้น ----------
    function syncImportTarget() {
      if (!targetSelect) return;

      // ใช้รายการล่าสุดจาก Dropdown หลัก เพื่อให้ Portfolio ที่เพิ่งสร้างแสดงใน Modal ด้วย
      if (activePortfolioSelect?.options.length > 1) {
        const activeOptions = Array.from(activePortfolioSelect.options).filter(option => option.value);
        targetSelect.innerHTML = "";
        activeOptions.forEach(source => {
          const option = document.createElement("option");
          option.value = source.value;
          option.textContent = source.textContent;
          targetSelect.appendChild(option);
        });
      }

      const activeId = activePortfolioSelect?.value || localStorage.getItem("currentPortfolioId") || "";
      if (activeId && Array.from(targetSelect.options).some(option => option.value === activeId)) {
        targetSelect.value = activeId;
      } else if (targetSelect.options.length) {
        targetSelect.selectedIndex = 0;
      }
    }

    activePortfolioSelect?.addEventListener("change", syncImportTarget);
    importModalEl?.addEventListener("show.bs.modal", syncImportTarget);
    $("btn-import-item")?.addEventListener("click", () => {
      syncImportTarget();
      importModal?.show();
    });

    // ---------- เปลี่ยนวิธีนำเข้าระหว่าง Paste และ Upload ----------
    function setImportMode(mode) {
      const uploadMode = mode === "upload";
      $("btn-paste-mode")?.classList.toggle("active", !uploadMode);
      $("btn-upload-mode")?.classList.toggle("active", uploadMode);
      $("import-upload-panel")?.classList.toggle("d-none", !uploadMode);
    }
    $("btn-paste-mode")?.addEventListener("click", () => setImportMode("paste"));
    $("btn-upload-mode")?.addEventListener("click", () => setImportMode("upload"));

    // ---------- รีเซ็ต Preview ----------
    function resetPreview() {
      verifiedItems = [];

      importButton.disabled = true;
      preview.classList.add("d-none");
    }

    // ---------- ดาวน์โหลดไฟล์ตัวอย่าง ----------
    $("btn-download-sample")?.addEventListener("click", () => {
      const sample = {
        id: "item-sample-001",
        title: "Sample Portfolio Item",
        type: "Challenge",

        date: new Date().toISOString().slice(0, 10),

        role: "Participant",
        description: "ตัวอย่างข้อมูลสำหรับทดสอบ Import",

        skills: ["JavaScript", "JSON"],

        reflection: {
          whatIDid: "ทดลองทำงาน",
          whatILearned: "เรียนรู้การ Import",
          challenge: "ตรวจสอบข้อมูล",
          nextStep: "พัฒนาต่อ"
        },

        evidence: [
          "https://github.com/example/repository"
        ],

        challengeId: "sample-challenge",
        hostGroup: "Group 6",
        category: "discover",
        schemaVersion: "1.0"
      };

      const blob = new Blob(
        [JSON.stringify(sample, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "sample-portfolio-item.json";
      a.click();

      URL.revokeObjectURL(url);
    });

    // ---------- เลือกไฟล์ JSON ----------
    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];

      if (!file) return;

      if (!/\.json$/i.test(file.name) || file.size > 256 * 1024) {
        show(error, "กรุณาเลือกไฟล์ .json ขนาดไม่เกิน 256 KB");
        resetPreview();
        return;
      }

      textArea.value = await file.text();

      resetPreview();
    });

    // ---------- Drag and Drop ----------
    drop?.addEventListener("dragover", e => {
      e.preventDefault();
      drop.classList.add("border-primary");
    });

    drop?.addEventListener("dragleave", () => {
      drop.classList.remove("border-primary");
    });

    drop?.addEventListener("drop", e => {
      e.preventDefault();

      drop.classList.remove("border-primary");

      const file = e.dataTransfer.files?.[0];

      if (!file) return;

      if (!/\.json$/i.test(file.name) || file.size > 256 * 1024) {
        show(error, "กรุณาเลือกไฟล์ .json ขนาดไม่เกิน 256 KB");
        resetPreview();
        return;
      }

      file.text().then(value => {
        textArea.value = value;
        resetPreview();
      });
    });

    // ---------- เมื่อแก้ไข JSON ----------
    textArea?.addEventListener("input", resetPreview);

    // ---------- ตรวจสอบและ Preview JSON ----------
    previewButton?.addEventListener("click", () => {
      error.classList.add("d-none");

      const result = validateItem(textArea.value);

      if (!result.valid) {
        show(error, result.errors.join(" • "));
        resetPreview();
        return;
      }

      if (!targetSelect.value) {
        show(error, "กรุณาเลือก Portfolio ปลายทาง");
        resetPreview();
        return;
      }

      const destination = portfolios.find(p => p.portfolioId === targetSelect.value);
      const existingIds = new Set((destination?.items || []).map(item => item.id));
      const duplicates = result.data.filter(item => existingIds.has(item.id));
      if (duplicates.length) {
        show(error, `พบ Item ID ซ้ำใน Portfolio ปลายทาง: ${duplicates.map(item => item.id).join(", ")}`);
        resetPreview();
        return;
      }

      verifiedItems = result.data;

      const first = verifiedItems[0];
      $("prev-id").textContent = verifiedItems.length === 1
        ? first.id
        : `${verifiedItems.length} รายการ`;
      $("prev-title").textContent = verifiedItems.length === 1
        ? first.title
        : `${first.title} และอีก ${verifiedItems.length - 1} รายการ`;
      $("prev-type").textContent = verifiedItems.length === 1
        ? first.type
        : "Multiple Items";
      $("prev-date").textContent = verifiedItems.length === 1
        ? first.date
        : "หลายวันที่";
      $("prev-skills").textContent = verifiedItems.length === 1
        ? first.skills.join(", ")
        : `รวม ${verifiedItems.length} Items (แสดงตัวอย่างรายการแรก)`;

      preview.classList.remove("d-none");
      importButton.disabled = false;
    });

    // ---------- ยืนยัน Import ลง Server (single guarded handler) ----------
    async function performImport() {
      if (isImporting || !verifiedItems.length || !targetSelect.value) return;

      isImporting = true;
      importButton.disabled = true;

      status.className = "alert alert-info py-2 px-3 mb-3";
      statusText.textContent = "กำลังบันทึกข้อมูลลง Server...";
      status.classList.remove("d-none");

      try {
        const destinationPortfolioId = targetSelect.value;

        const importResult = await request("api/import-item.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            portfolioId: destinationPortfolioId,
            items: verifiedItems
          })
        });

        // Keep the legacy Submission Helper's local checklist data in sync.
        // The Server remains the source of truth for the Portfolio itself.
        try {
          const checklistKey = `portfolio_${destinationPortfolioId}_items`;
          const checklistItems = JSON.parse(localStorage.getItem(checklistKey) || "[]");
          const savedItems = importResult.items || verifiedItems;
          const knownIds = new Set(checklistItems.map(item => item.id));
          savedItems.forEach(item => {
            if (!knownIds.has(item.id)) checklistItems.push(item);
          });
          localStorage.setItem(checklistKey, JSON.stringify(checklistItems));
        } catch (storageError) {
          console.warn("อัปเดตข้อมูล Submission Helper ใน LocalStorage ไม่สำเร็จ:", storageError);
        }

        if (typeof window.refreshPortfolioData !== "function") {
          throw new Error("ไม่พบฟังก์ชัน Refresh Portfolio จาก Server");
        }
        portfolios = await window.refreshPortfolioData();

        if (exportSelect && Array.from(exportSelect.options).some(option => option.value === destinationPortfolioId)) {
          exportSelect.value = destinationPortfolioId;
          exportSelect.dispatchEvent(new Event("change"));
        }

        status.className = "alert alert-success py-2 px-3 mb-3";
        statusText.textContent = `Import สำเร็จ! เพิ่ม ${importResult.importedCount || verifiedItems.length} Items ลงใน Portfolio แล้ว`;

        verifiedItems = [];
        textArea.value = "";
        if (fileInput) fileInput.value = "";
        preview.classList.add("d-none");

        if (typeof window.showStatus === "function") {
          window.showStatus("Import Portfolio Item สำเร็จแล้ว", "success");
        }

        importModal?.hide();

      } catch (e) {
        status.className = "alert alert-danger py-2 px-3 mb-3";
        statusText.textContent = `Import ไม่สำเร็จ: ${e.message}`;
        importButton.disabled = false;
      } finally {
        isImporting = false;
      }
    }

    importButton?.addEventListener("click", performImport);
    $("btn-retry-import")?.addEventListener("click", performImport);

    importModalEl?.addEventListener("hidden.bs.modal", () => {
      resetPreview();
      error?.classList.add("d-none");
      status?.classList.add("d-none");
    });

    // ---------- เตรียมข้อมูล Export ----------
    async function prepareExport() {
      exportPayload = "";

      exportButton.disabled = true;
      copyButton.disabled = true;

      const id = exportSelect.value;

      const resetChecklist = () => {
        ["chk-imported-item", "chk-reflection", "chk-evidence"].forEach(checkId => {
          const el = $(checkId);
          if (!el) return;
          el.textContent = "กรุณาเลือก Portfolio";
          el.className = "mb-2 text-muted";
        });
      };

      if (!id) {
        resetChecklist();
        return;
      }

      try {
        const latest = await request(API);

        const portfolio = latest.find(p => p.portfolioId === id);

        if (!portfolio) {
          throw new Error("ไม่พบ Portfolio ที่เลือก");
        }

        const items = Array.isArray(portfolio.items)
          ? portfolio.items
          : [];

        // เลือกเฉพาะ Item ที่เกี่ยวข้องกับการ Import
        const imported = items.filter(item =>
          item.importStatus === "pending" ||
          item.exchangeId ||
          item.challengeId
        );

        // ตรวจสอบ Reflection
        const completeReflection = imported.some(item => {
          const r = item.reflection || {};

          return [
            "whatIDid",
            "whatILearned",
            "challenge",
            "nextStep"
          ].every(k =>
            typeof r[k] === "string" && r[k].trim()
          );
        });

        // ตรวจสอบ Evidence URL
        const hasEvidence = imported.some(item =>
          Array.isArray(item.evidence) &&
          item.evidence.some(url =>
            typeof url === "string" &&
            /^https?:\/\//i.test(url)
          )
        );

        // ---------- แสดงสถานะ Checklist ----------
        const setCheck = (id, passed, successText, missingText) => {
          const el = $(id);
          if (!el) return;

          el.textContent = passed ? successText : missingText;
          el.className = passed
            ? "mb-2 submission-check-passed"
            : "mb-2 submission-check-failed";
        };

        setCheck(
          "chk-imported-item",
          imported.length > 0,
          "มี Item จากเพื่อนต่างกลุ่มอย่างน้อย 1 รายการ",
          "ไม่มี Item จากเพื่อนต่างกลุ่มอย่างน้อย 1 รายการ"
        );
        setCheck(
          "chk-reflection",
          completeReflection,
          "Item ที่นำเข้ามีข้อมูล Reflection ครบถ้วน",
          "Item ที่นำเข้ามีข้อมูล Reflection ไม่ครบถ้วน"
        );
        setCheck(
          "chk-evidence",
          hasEvidence,
          "Item ที่นำเข้ามีหลักฐาน Evidence แนบอยู่",
          "Item ที่นำเข้าไม่มีหลักฐาน Evidence แนบอยู่"
        );

        // ---------- สร้างข้อมูล JSON ----------
        exportPayload = JSON.stringify({
          portfolioId: portfolio.portfolioId,
          name: portfolio.name,

          whatIEnjoy: portfolio.whatIEnjoy,
          whatIveTried: portfolio.whatIveTried,
          whatImCuriousAbout: portfolio.whatImCuriousAbout,

          items,

          exportedAt: new Date().toISOString()

        }, null, 2);

        exportButton.disabled = false;
        copyButton.disabled = false;

        if (exportAlert) {
          exportAlert.classList.add("d-none");
        }

      } catch (e) {
        show(exportAlert, `เตรียม Export ไม่สำเร็จ: ${e.message}`);
      }
    }

    // ---------- เมื่อเลือก Portfolio สำหรับ Export ----------
    exportSelect.addEventListener("change", prepareExport);

    // ---------- ดาวน์โหลด JSON ----------
    exportButton?.addEventListener("click", () => {
      if (!exportPayload) return;

      const blob = new Blob(
        [exportPayload],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "my-portfolio.json";
      a.click();

      URL.revokeObjectURL(url);

      show(exportAlert, "Export Portfolio สำเร็จ", "success");
    });

    // ---------- คัดลอก JSON ----------
    copyButton?.addEventListener("click", async () => {
      if (!exportPayload) return;

      try {
        const copied = await window.copyJsonToClipboard(exportPayload);

        if (copied) {
          show(exportAlert, "คัดลอก JSON เรียบร้อยแล้ว", "success");
        } else {
          show(exportAlert, "คัดลอกไม่สำเร็จ กรุณาใช้ Export ดาวน์โหลดไฟล์แทน");
        }
      } catch {
        show(exportAlert, "คัดลอกไม่สำเร็จ กรุณาใช้ Export ดาวน์โหลดไฟล์แทน");
      }
    });
  }

  // ---------- เริ่มทำงานเมื่อ DOM โหลดเสร็จ ----------
  document.addEventListener("DOMContentLoaded", init);

})();