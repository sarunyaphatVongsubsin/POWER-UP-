// ===== ค่าคงที่ =====
const SAMPLE_FILES = ["sample-portfolio-1.json", "sample-portfolio-2.json"];
const PORTFOLIOS_KEY = "portfolios";
const CURRENT_ID_KEY = "currentPortfolioId";

// ===== Storage helpers =====
// ตรวจข้อมูลด้วย validatePortfolioData (validation.js) แล้วทำให้โครงสร้างครบด้วย createPortfolio (data-model.js)
// ตัวที่ไม่ผ่านจะถูกข้าม และแจ้งสาเหตุใน Console
function sanitizePortfolios(list, source) {
  return list.reduce(function (valid, p) {
    const errors = validatePortfolioData(p);
    if (errors.length > 0) {
      console.warn("ข้าม portfolio จาก " + source + ":", errors);
    } else {
      valid.push(createPortfolio(p));
    }
    return valid;
  }, []);
}

// คืนค่า array ถ้ามีข้อมูลที่ใช้ได้ใน localStorage, ไม่เช่นนั้นคืน null
function readPortfolios() {
  try {
    const data = JSON.parse(localStorage.getItem(PORTFOLIOS_KEY));
    if (!Array.isArray(data)) return null;
    const valid = sanitizePortfolios(data, "localStorage");
    // ถ้ามีข้อมูลแต่ไม่ผ่านการตรวจเลย ให้ถือว่าใช้ไม่ได้ แล้วโหลดตัวอย่างใหม่
    return data.length > 0 && valid.length === 0 ? null : valid;
  } catch (e) {
    return null;
  }
}

function savePortfolios(list) {
  localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(list));
}

// ดึงข้อมูลตัวอย่างจากไฟล์ JSON (แต่ละไฟล์เป็น object ของ portfolio เดียว หรือ array ก็ได้)
async function fetchSamplePortfolios() {
  const results = await Promise.all(
    SAMPLE_FILES.map(async function (file) {
      const res = await fetch(file);
      if (!res.ok) throw new Error("โหลด " + file + " ไม่สำเร็จ (" + res.status + ")");
      return res.json();
    })
  );
  return sanitizePortfolios(results.flat(), "sample files");
}

// ===== UI helpers =====
function showStatus(message, type) {
  const area = document.getElementById("toast-area");
  if (!area) return;
  const kind = type === "danger" ? "error" : type === "warning" ? "warning" : "success";
  const toast = document.createElement("div");
  toast.className = "toast-msg " + kind;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  area.appendChild(toast);
  setTimeout(function () {
    toast.classList.add("hide");
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

// หน้าต่างยืนยันตามธีมเว็บ (แทน confirm) คืนค่า Promise<boolean>
function confirmDialog(message, options) {
  const opts = options || {};
  return new Promise(function (resolve) {
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
    title.textContent = opts.title || "ยืนยันการทำรายการ";

    const msg = document.createElement("p");
    msg.className = "confirm-message";
    msg.textContent = message;

    const actions = document.createElement("div");
    actions.className = "confirm-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn-confirm-cancel";
    cancelBtn.textContent = opts.cancelText || "ยกเลิก";

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "btn-confirm-ok";
    okBtn.textContent = opts.confirmText || "ยืนยัน";

    function close(result) {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (previousFocus && previousFocus.focus) previousFocus.focus();
      resolve(result);
    }
    function onKey(e) {
      if (e.key === "Escape") close(false);
    }

    cancelBtn.addEventListener("click", function () { close(false); });
    okBtn.addEventListener("click", function () { close(true); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close(false);
    });
    document.addEventListener("keydown", onKey);

    actions.append(cancelBtn, okBtn);
    box.append(title, msg, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    cancelBtn.focus();
  });
}

function splitList(text) {
  return text
    .split(/[,\n]/)
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

// ===== Main =====
document.addEventListener("DOMContentLoaded", async function () {
  const portfolioCountEl = document.getElementById("portfolio-count");
  const portfolioSelectEl = document.getElementById("portfolio-select");
  const viewWhatEnjoyEl = document.getElementById("view-what-enjoy");
  const viewWhatTriedEl = document.getElementById("view-what-tried");
  const viewWhatCuriousEl = document.getElementById("view-what-curious");
  const portfolioItemsCountEl = document.getElementById("portfolio-items-count");
  const itemsListEl = document.getElementById("portfolio-items-list");

  // 1. โหลดข้อมูล: ใช้จาก localStorage ก่อน ถ้ายังไม่มีค่อย fetch จากไฟล์ตัวอย่าง
  let portfolios = readPortfolios();
  if (portfolios === null) {
    try {
      portfolios = await fetchSamplePortfolios();
      savePortfolios(portfolios);
    } catch (err) {
      console.error(err);
      portfolios = [];
      showStatus("โหลดข้อมูลตัวอย่างไม่ได้ (ต้องเปิดผ่าน server เช่น Live Server ไม่ใช่ file://)", "danger");
    }
  }

  function getCurrentPortfolio() {
    const id = localStorage.getItem(CURRENT_ID_KEY);
    return portfolios.find(function (p) { return p.portfolioId === id; }) || null;
  }

  // 2. Render
  async function deleteItem(itemId) {
    const target = getCurrentPortfolio();
    if (!target) return;
    const ok = await confirmDialog("ต้องการลบ Item นี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้", {
      title: "ลบ Item",
      confirmText: "ลบ"
    });
    if (!ok) return;
    target.items = (target.items || []).filter(function (i) { return i.id !== itemId; });
    savePortfolios(portfolios);
    renderPortfolioView(target);
    showStatus("ลบ Item เรียบร้อยแล้ว!");
  }

  function createReflectionBlock(label, text) {
    const wrap = document.createElement("div");
    wrap.className = "reflection-block";
    const l = document.createElement("div");
    l.className = "reflection-label";
    l.textContent = label;
    const t = document.createElement("div");
    t.className = "reflection-text";
    t.textContent = text || "-";
    wrap.append(l, t);
    return wrap;
  }

  function renderItems(portfolio) {
    if (!itemsListEl) return;
    itemsListEl.innerHTML = "";
    const items = portfolio && Array.isArray(portfolio.items) ? portfolio.items : [];
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "text-muted mb-0";
      empty.textContent = "ยังไม่มี Item ใน Portfolio นี้";
      itemsListEl.appendChild(empty);
      return;
    }

    items.forEach(function (item) {
      const reflection = item.reflection || {};
      const card = document.createElement("article");
      card.className = "item-card";

      // แถวบน: ประเภท + วันที่
      const top = document.createElement("div");
      top.className = "item-top";
      const type = document.createElement("span");
      type.className = "item-type";
      type.textContent = item.type || "Other";
      const date = document.createElement("span");
      date.className = "item-date";
      date.textContent = "📅 " + (item.date || "-");
      top.append(type, date);

      // ชื่อ + role
      const title = document.createElement("h3");
      title.textContent = item.title;
      const role = document.createElement("div");
      role.className = "item-meta";
      role.textContent = "🌸 " + (item.role || "-");

      // description
      const desc = document.createElement("p");
      desc.className = "item-desc";
      desc.textContent = item.description;

      // skills
      const skills = document.createElement("div");
      skills.className = "skill-list";
      (item.skills || []).forEach(function (skill) {
        const chip = document.createElement("span");
        chip.className = "skill-chip";
        chip.textContent = skill;
        skills.appendChild(chip);
      });

      // reflection
      const refl = document.createElement("div");
      refl.className = "reflection";
      refl.append(
        createReflectionBlock("What I did", reflection.whatIDid),
        createReflectionBlock("What I learned", reflection.whatILearned),
        createReflectionBlock("Challenge", reflection.challenge),
        createReflectionBlock("Next step", reflection.nextStep)
      );

      // evidence
      const evidenceLabel = document.createElement("div");
      evidenceLabel.className = "evidence-label";
      evidenceLabel.textContent = "🔗 Evidence";
      const evidenceList = document.createElement("ul");
      evidenceList.className = "evidence-list";
      (item.evidence || []).forEach(function (url) {
        const li = document.createElement("li");
        if (/^https?:\/\//i.test(url)) {
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = url;
          li.appendChild(a);
        } else {
          li.textContent = url;
        }
        evidenceList.appendChild(li);
      });

      // ปุ่มลบ
      const footer = document.createElement("div");
      footer.className = "item-footer";
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-delete-item";
      delBtn.textContent = "🗑 ลบ Item";
      delBtn.addEventListener("click", function () { deleteItem(item.id); });
      footer.appendChild(delBtn);

      card.append(top, title, role, desc, skills, refl, evidenceLabel, evidenceList, footer);
      itemsListEl.appendChild(card);
    });
  }

  function renderPortfolioView(portfolio) {
    const p = portfolio || {};
    if (viewWhatEnjoyEl) viewWhatEnjoyEl.textContent = p.whatIEnjoy || "-";
    if (viewWhatTriedEl) viewWhatTriedEl.textContent = p.whatIveTried || "-";
    if (viewWhatCuriousEl) viewWhatCuriousEl.textContent = p.whatImCuriousAbout || "-";
    if (portfolioItemsCountEl) {
      portfolioItemsCountEl.textContent = Array.isArray(p.items) ? p.items.length : 0;
    }
    renderItems(portfolio);
  }

  function renderSelect() {
    if (!portfolioSelectEl) return;
    portfolioSelectEl.innerHTML = '<option value="" disabled>-- เลือก Portfolio --</option>';
    portfolios.forEach(function (p) {
      const option = document.createElement("option");
      option.value = p.portfolioId;
      option.textContent = p.name;
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

  function renderAll() {
    if (portfolioCountEl) portfolioCountEl.textContent = portfolios.length;
    renderSelect();
  }

  renderAll();

  // 3. เปลี่ยน Portfolio จาก dropdown
  if (portfolioSelectEl) {
    portfolioSelectEl.addEventListener("change", function (event) {
      localStorage.setItem(CURRENT_ID_KEY, event.target.value);
      renderPortfolioView(getCurrentPortfolio());
    });
  }

  // 4. ปุ่ม Reset Data: โหลดไฟล์ตัวอย่างใหม่แล้วเขียนทับ localStorage
  const resetBtn = document.getElementById("btn-reset-data");
  if (resetBtn) {
    resetBtn.addEventListener("click", async function () {
      const ok = await confirmDialog("ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างใช่หรือไม่? ข้อมูลที่เพิ่มไว้จะหายทั้งหมด", {
        title: "Reset Data",
        confirmText: "รีเซ็ต"
      });
      if (!ok) return;
      try {
        portfolios = await fetchSamplePortfolios();
        savePortfolios(portfolios);
        localStorage.removeItem(CURRENT_ID_KEY);
        renderAll();
        showStatus("รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว!");
      } catch (err) {
        console.error(err);
        showStatus("รีเซ็ตไม่สำเร็จ: โหลดไฟล์ตัวอย่างไม่ได้", "danger");
      }
    });
  }

  // 5. ฟอร์มสร้าง Portfolio ใหม่
  const portfolioForm = document.getElementById("portfolio-form");
  if (portfolioForm) {
    portfolioForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!portfolioForm.checkValidity()) {
        event.stopPropagation();
        portfolioForm.classList.add("was-validated");
        return;
      }

      const newPortfolio = {
        portfolioId: "port-" + Date.now(),
        name: document.getElementById("p-name").value.trim(),
        whatIEnjoy: document.getElementById("p-enjoy").value.trim(),
        whatIveTried: document.getElementById("p-tried").value.trim(),
        whatImCuriousAbout: document.getElementById("p-curious").value.trim(),
        items: []
      };

      const portfolioErrors = validatePortfolioData(newPortfolio);
      if (portfolioErrors.length > 0) {
        showStatus(portfolioErrors[0], "danger");
        return;
      }

      portfolios.push(newPortfolio);
      savePortfolios(portfolios);
      localStorage.setItem(CURRENT_ID_KEY, newPortfolio.portfolioId);
      renderAll();

      showStatus("บันทึกข้อมูล Portfolio สำเร็จเรียบร้อยแล้ว!");
      portfolioForm.reset();
      portfolioForm.classList.remove("was-validated");
    });
  }

  // 6. ฟอร์มเพิ่ม Portfolio Item (เพิ่มเข้า Portfolio ที่เลือกอยู่)
  const itemForm = document.getElementById("item-form");
  if (itemForm) {
    itemForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!itemForm.checkValidity()) {
        event.stopPropagation();
        itemForm.classList.add("was-validated");
        return;
      }

      const target = getCurrentPortfolio();
      if (!target) {
        showStatus("กรุณาเลือกหรือสร้าง Portfolio ก่อนเพิ่ม Item", "warning");
        return;
      }

      const val = function (id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const newItem = {
        id: "item-" + Date.now(),
        title: val("item-title"),
        type: val("item-type"),
        date: val("item-date"),
        role: val("item-role"),
        description: val("item-description"),
        skills: splitList(val("item-skills")),
        reflection: {
          whatIDid: val("item-what-did"),
          whatILearned: val("item-what-learned"),
          challenge: val("item-challenge"),
          nextStep: val("item-next-step")
        },
        evidence: splitList(val("item-evidence"))
      };

      const itemErrors = validatePortfolioItemData(newItem);
      if (itemErrors.length > 0) {
        showStatus(itemErrors[0], "danger");
        return;
      }

      if (!Array.isArray(target.items)) target.items = [];
      target.items.push(newItem);
      savePortfolios(portfolios);
      renderPortfolioView(target);

      showStatus("บันทึก Portfolio Item สำเร็จเรียบร้อยแล้ว!");
      itemForm.reset();
      itemForm.classList.remove("was-validated");
    });
  }
});