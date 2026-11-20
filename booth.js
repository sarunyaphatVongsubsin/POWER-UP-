"use strict";

const CHALLENGES =
  typeof window !== "undefined" && Array.isArray(window.CHALLENGES) && window.CHALLENGES.length
    ? window.CHALLENGES
    : typeof window !== "undefined" && window.CHALLENGE_CONFIG
      ? [window.CHALLENGE_CONFIG]
      : [];

const $ = id => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeList(tag, items) {
  const list = el(tag);
  (Array.isArray(items) ? items : []).forEach(text => list.appendChild(el("li", "", text)));
  return list;
}

function makeBlock(title, content) {
  const block = el("div", "challenge-block");
  block.append(el("h4", "", title), content);
  return block;
}

function showStatus(message, kind = "success") {
  const area = $("toast-area");
  if (!area) return;
  const toast = el("div", `toast-msg ${kind}`, message);
  toast.setAttribute("role", "status");
  area.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function todayString() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

let lastGeneratedId = "";
function generateItemId() {
  let id;
  do {
    const rand = Math.random().toString(36).slice(2, 7);
    id = `item-booth-${Date.now().toString(36)}-${rand}`;
  } while (id === lastGeneratedId);
  lastGeneratedId = id;
  return id;
}

function buildPortfolioItem(challenge, playerName, note) {
  const itemConfig = challenge.item || {};
  const reflectionConfig = challenge.defaultReflection || {};
  const skills = Array.isArray(itemConfig.skills)
    ? [...itemConfig.skills]
    : Array.isArray(challenge.skills)
      ? [...challenge.skills]
      : [];
  const evidence = Array.isArray(itemConfig.evidence)
    ? [...itemConfig.evidence]
    : challenge.defaultEvidenceUrl
      ? [challenge.defaultEvidenceUrl]
      : [];
  const item = {
    id: generateItemId(),
    title: challenge.title || "",
    type: itemConfig.type || "Challenge",
    date: todayString(),
    role: playerName
      ? `${challenge.role || "Booth Participant"}: ${playerName}`
      : challenge.role || "Booth Participant",
    description: challenge.description || "",
    skills,
    reflection: {
      whatIDid: note || reflectionConfig.whatIDid || "",
      whatILearned: itemConfig.learned || reflectionConfig.whatILearned || "",
      challenge: itemConfig.difficulty || reflectionConfig.challenge || "",
      nextStep: itemConfig.nextStep || reflectionConfig.nextStep || ""
    },
    evidence
  };
  if (challenge.challengeId) item.challengeId = challenge.challengeId;
  if (challenge.hostGroup) item.hostGroup = challenge.hostGroup;
  if (challenge.category) item.category = challenge.category;
  if (challenge.challengeId || challenge.hostGroup || challenge.category) {
    item.schemaVersion = "1.0";
  }
  return item;
}

function checkItem(item) {
  const errors = [];
  ["id", "title", "type", "date", "role", "description"].forEach(key => {
    if (typeof item[key] !== "string" || !item[key].trim()) errors.push(`${key} ว่างอยู่`);
  });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) errors.push("date ต้องเป็น YYYY-MM-DD");
  if (!Array.isArray(item.skills) || !item.skills.length) errors.push("skills ว่างอยู่");
  ["whatIDid", "whatILearned", "challenge", "nextStep"].forEach(key => {
    if (typeof item.reflection[key] !== "string" || !item.reflection[key].trim())
      errors.push(`reflection.${key} ว่างอยู่`);
  });
  return errors;
}

function renderChallenges() {
  const list = $("challenge-list");
  const select = $("host-challenge");
  $("challenge-count").textContent = CHALLENGES.length;

  CHALLENGES.forEach(challenge => {
    const challengeId = challenge.id || challenge.challengeId || "";
    const option = el("option", "", challenge.title);
    option.value = challengeId;
    select.appendChild(option);

    const card = el("article", "challenge-card");
    card.id = `card-${challengeId}`;
    if (challenge.duration) {
      card.append(el("span", "challenge-time", `⏱ ${challenge.duration}`));
    } else if (challenge.hostGroup) {
      card.append(el("span", "challenge-time", challenge.hostGroup));
    }
    card.append(
      el("h3", "", challenge.title),
      el("p", "mb-0", challenge.description)
    );

    const body = el("div", "challenge-body");
    if (Array.isArray(challenge.steps) && challenge.steps.length) {
      body.append(makeBlock("ขั้นตอน", makeList("ol", challenge.steps)));
    }
    if (Array.isArray(challenge.criteria) && challenge.criteria.length) {
      body.append(makeBlock("เกณฑ์ผ่าน", makeList("ul", challenge.criteria)));
    }
    if (Array.isArray(challenge.materials) && challenge.materials.length) {
      body.append(makeBlock("วัสดุที่ใช้", makeList("ul", challenge.materials)));
    }
    if (!body.children.length && Array.isArray(challenge.skills) && challenge.skills.length) {
      body.append(makeBlock("ทักษะที่ได้", makeList("ul", challenge.skills)));
    }
    if (body.children.length) {
      card.appendChild(body);
    }

    if (challenge.mode === "webapp" && challenge.webAppUrl) {
      const frame = el("iframe", "webapp-frame");
      frame.src = challenge.webAppUrl;
      frame.title = `Web App: ${challenge.title}`;
      frame.loading = "lazy";
      card.appendChild(frame);
    } else if (challenge.hostGuide) {
      const guide = el("div", "host-note");
      guide.append(el("strong", "", "คำแนะนำสำหรับ Host (onsite)"), el("span", "", challenge.hostGuide));
      card.appendChild(guide);
    }

    const pick = el("button", "btn btn-outline-secondary btn-sm rounded-pill px-3 mt-3", "ใช้ใน Host Tool");
    pick.type = "button";
    pick.addEventListener("click", () => {
      select.value = challengeId;
      select.classList.remove("is-invalid");
      $("host-tool-section").scrollIntoView({ behavior: "smooth", block: "start" });
      $("host-player").focus({ preventScroll: true });
    });
    card.appendChild(pick);

    list.appendChild(card);
  });
}

function showFormError(fields) {
  const box = $("host-error");
  box.textContent = `กรอกข้อมูลไม่ครบ กรุณากรอก: ${fields.join(", ")}`;
  box.hidden = false;
}

function clearFormError() {
  $("host-error").hidden = true;
  $("host-challenge").classList.remove("is-invalid");
  $("host-note").classList.remove("is-invalid");
}

function handleGenerate(event) {
  event.preventDefault();
  clearFormError();

  const challengeId = $("host-challenge").value;
  const playerName = $("host-player").value.trim();
  const note = $("host-note").value.trim();
  const challenge = CHALLENGES.find(c => (c.id || c.challengeId) === challengeId);

  const missing = [];
  if (!challenge) {
    $("host-challenge").classList.add("is-invalid");
    missing.push("Challenge");
  }
  if (!note) {
    $("host-note").classList.add("is-invalid");
    missing.push("หมายเหตุ/ผลที่ผู้เล่นทำได้");
  }
  if (missing.length) {
    showFormError(missing);
    (challenge ? $("host-note") : $("host-challenge")).focus();
    return;
  }

  const item = buildPortfolioItem(challenge, playerName, note);
  const problems = checkItem(item);
  if (problems.length) {
    const box = $("host-error");
    box.textContent = `สร้าง JSON ไม่สำเร็จ: ${problems.join(", ")}`;
    box.hidden = false;
    return;
  }

  const output = $("json-output");
  output.value = JSON.stringify(item, null, 2);
  $("output-meta").textContent = `id: ${item.id}`;
  $("output-area").hidden = false;
  setCopyStatus("");
  showStatus("สร้าง Portfolio Item JSON ใหม่เรียบร้อยแล้ว!");
}

function setCopyStatus(message, kind = "") {
  const status = $("copy-status");
  status.textContent = message;
  status.className = `small fw-semibold ${kind}`.trim();
}

async function copyJson() {
  const output = $("json-output");
  const text = output.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    setCopyStatus("คัดลอกแล้ว ✓", "ok");
    showStatus("คัดลอก JSON สำเร็จ!");
    return;
  } catch {
  }

  output.focus();
  output.select();
  output.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  if (copied) {
    setCopyStatus("คัดลอกแล้ว ✓", "ok");
    showStatus("คัดลอก JSON สำเร็จ!");
  } else {
    setCopyStatus("คัดลอกอัตโนมัติไม่ได้ เลือกข้อความให้แล้ว กด Ctrl+C (Mac: ⌘+C) เพื่อคัดลอก", "warn");
    showStatus("คัดลอกอัตโนมัติไม่ได้ กรุณากด Ctrl+C / ⌘+C", "warning");
  }
}

function downloadJson() {
  const text = $("json-output").value;
  if (!text) return;

  const id = JSON.parse(text).id;
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portfolio-item-${id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setCopyStatus("ดาวน์โหลดไฟล์แล้ว ✓", "ok");
}

document.addEventListener("DOMContentLoaded", () => {
  renderChallenges();
  $("host-form").addEventListener("submit", handleGenerate);
  $("host-challenge").addEventListener("change", clearFormError);
  $("host-note").addEventListener("input", () => $("host-note").classList.remove("is-invalid"));
  $("btn-copy").addEventListener("click", copyJson);
  $("btn-download").addEventListener("click", downloadJson);
});