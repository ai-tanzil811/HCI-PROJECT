// ============================================================
// Nirapod Survey — Configuration & Storage
// ============================================================
const DEFAULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbyyJNoGnBkh-HfTDG10FjqFg9y3zGADyN1Fw_PEtyvh1GbG067oGXLc7mF1UUPJxfcyHQ/exec";
let ENDPOINT_URL = localStorage.getItem("nirapod_endpoint") || DEFAULT_ENDPOINT;

const STORAGE_KEY = "nirapod_survey_progress";

// ============================================================
// Question definitions — mirrors the original Nirapod Form
// ============================================================
const SECTIONS = [
  {
    label: "Demographics & usage background",
    questions: [
      {
        id: "age_group", type: "radio", required: true,
        title: "What is your age group?",
        options: ["Under 18", "18–24", "25–34", "35–44", "45–54", "55 or above", "Prefer not to say"]
      },
      {
        id: "hand_used", type: "radio", required: true,
        title: "Which hand do you normally use to operate your phone?",
        options: ["Left hand", "Right hand", "Both hands equally", "It depends on the situation"]
      },
      {
        id: "unsafe_locations", type: "checkbox", required: true,
        title: "Where do you most often feel unsafe?",
        help: "Select all locations that apply.",
        options: [
          "Streets / walking alone",
          "Public transit / transit stops",
          "Parking lots / garages",
          "Campus or workplace",
          "Home or residential area"
        ],
        allowOther: true
      },
      {
        id: "transit_frequency", type: "radio", required: false,
        title: "How often do you use public transportation?",
        options: ["Daily", "Several times a week", "Once a week", "A few times a month", "Rarely / Never"]
      }
    ]
  },
  {
    label: "Phone behaviour under stress",
    questions: [
      {
        id: "small_buttons_difficulty", type: "likert", required: true,
        title: "I find it difficult to accurately press small buttons when my hands are moving.",
        help: "During stressful or unsafe moments in daily life — running, feeling threatened, or in a panic — how usable is your phone, really?",
        capLow: "Disagree", capHigh: "Agree"
      },
      {
        id: "prefers_minimal_interaction", type: "likert", required: true,
        title: "I would prefer an emergency function that requires minimal interaction.",
        capLow: "Disagree", capHigh: "Agree"
      },
      {
        id: "unsafe_response", type: "checkbox", required: true,
        title: "If you suddenly felt unsafe, what would you most likely do?",
        options: [
          "Try to contact someone I trust",
          "Move to a safer/crowded location",
          "Contact emergency services",
          "Use an SOS/emergency feature on my phone",
          "Ask a nearby person for help",
          "Leave the location/area as soon as possible"
        ],
        allowOther: true
      }
    ]
  },
  {
    label: "Trust & emergency trigger preference",
    questions: [
      {
        id: "auto_detection_usefulness", type: "likert", required: true,
        title: "How useful would an automatic emergency detection feature be?",
        capLow: "Not useful", capHigh: "Strongly useful"
      },
      {
        id: "auto_alert_trust", type: "likert", required: true,
        title: "How much would you trust an emergency alert triggered automatically by the application?",
        capLow: "Not at all", capHigh: "Greatly trustable"
      },
      {
        id: "preferred_trigger", type: "radio", required: true,
        title: "Which emergency trigger would you prefer?",
        options: ["SOS button", "Shake the phone", "Power-button press"],
        image: "assets/section03.png",
        allowOther: true
      },
      {
        id: "sos_scenario_response", type: "text", required: false,
        title: "In a scenario like getting followed, mugged, or facing sudden danger — if you needed to send an SOS signal, how would you want to do it?",
        help: "Optional — answer in your own words."
      },
      {
        id: "cancel_window_wanted", type: "radio", required: true,
        title: "Would you want a short period to cancel an emergency alert before it is sent?",
        options: ["Yes", "No", "Maybe"]
      }
    ]
  },
  {
    label: "Bystander response",
    questions: [
      {
        id: "bystander_response_likelihood", type: "likert", required: true,
        title: "What are the chances that you will actually respond to the distress signal?",
        capLow: "I might ignore", capHigh: "Yes, I will"
      },
      {
        id: "bystander_motivators", type: "checkbox", required: true,
        title: "What would make you more likely to respond to an emergency notification from a nearby person?",
        help: "Select all that apply.",
        options: [
          "Clear indication that the situation is an emergency",
          "Approximate location of the person",
          "Information about what type of help is needed",
          "Ability to contact the person",
          "Confirmation from multiple nearby users",
          "Emergency services involvement"
        ],
        allowOther: true
      },
      {
        id: "wants_interview", type: "radio", required: true,
        title: "If we conduct an interview later, would you like to participate?",
        options: ["Yes", "No"],
        allowOther: true
      }
    ]
  }
];

// Flatten questions into ordered steps
const STEPS = [{ kind: "intro" }];
let totalQuestions = 0;
SECTIONS.forEach((section, sIdx) => {
  section.questions.forEach((q) => {
    totalQuestions++;
    STEPS.push({ kind: "question", section, sectionIndex: sIdx, q, qIndex: totalQuestions });
  });
});
STEPS.push({ kind: "review" });
STEPS.push({ kind: "submit" });

// Likert Ratings Descriptors
const LIKERT_DESCRIPTORS = {
  1: "1 — Strongly Disagree",
  2: "2 — Disagree",
  3: "3 — Neutral / Moderate",
  4: "4 — Agree",
  5: "5 — Strongly Agree"
};

// ============================================================
// Global State
// ============================================================
let currentStepIndex = 0;
let transitionDirection = "next";
let answers = loadSavedAnswers();

// UI Elements
const root = document.getElementById("app-root");
const progressFill = document.getElementById("progressFill");
const progressSectionName = document.getElementById("progressSectionName");
const progressPct = document.getElementById("progressPct");
const headerStepCounter = document.getElementById("headerStepCounter");

// Drawer & Modal Elements
const drawerToggleBtn = document.getElementById("drawerToggleBtn");
const drawerOverlay = document.getElementById("drawerOverlay");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const drawerList = document.getElementById("drawerList");

const settingsToggleBtn = document.getElementById("settingsToggleBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const endpointInput = document.getElementById("endpointInput");
const saveEndpointBtn = document.getElementById("saveEndpointBtn");
const testEndpointBtn = document.getElementById("testEndpointBtn");
const endpointStatus = document.getElementById("endpointStatus");

const themeToggleBtn = document.getElementById("themeToggleBtn");

// ============================================================
// Initialization & Persistence
// ============================================================
function init() {
  initTheme();
  setupEventListeners();
  render();
}

function loadSavedAnswers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

function saveAnswers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.error("Could not save answers to localStorage", e);
  }
}

function clearSavedAnswers() {
  answers = {};
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================
// Theme & Drawer Controls
// ============================================================
function initTheme() {
  const savedTheme = localStorage.getItem("nirapod_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem("nirapod_theme", nextTheme);
}

function toggleDrawer(show) {
  if (show === undefined) show = !drawerOverlay.classList.contains("active");
  if (show) {
    renderDrawerList();
    drawerOverlay.classList.add("active");
  } else {
    drawerOverlay.classList.remove("active");
  }
}

function toggleSettings(show) {
  if (show === undefined) show = !settingsModal.classList.contains("active");
  if (show) {
    endpointInput.value = ENDPOINT_URL;
    endpointStatus.innerHTML = "";
    settingsModal.classList.add("active");
  } else {
    settingsModal.classList.remove("active");
  }
}

// ============================================================
// Render & Progress System
// ============================================================
function updateProgress() {
  const step = STEPS[currentStepIndex];

  if (step.kind === "intro") {
    progressFill.style.width = "0%";
    progressPct.textContent = "0%";
    progressSectionName.textContent = "Welcome";
    headerStepCounter.textContent = "Intro";
    return;
  }

  if (step.kind === "submit" || step.kind === "review") {
    progressFill.style.width = "100%";
    progressPct.textContent = "100%";
    progressSectionName.textContent = step.kind === "review" ? "Review Answers" : "Submission";
    headerStepCounter.textContent = step.kind === "review" ? "Review" : "Done";
    return;
  }

  // Question step
  const pct = Math.round((step.qIndex / totalQuestions) * 100);
  progressFill.style.width = pct + "%";
  progressPct.textContent = pct + "%";
  progressSectionName.textContent = step.section.label;
  headerStepCounter.textContent = `Q${step.qIndex} of ${totalQuestions}`;
}

function render() {
  updateProgress();
  const step = STEPS[currentStepIndex];
  root.innerHTML = "";

  // Apply slide animation class
  root.className = `card ${transitionDirection === "next" ? "card-anim-next" : "card-anim-back"}`;

  if (step.kind === "intro") return renderIntro();
  if (step.kind === "question") return renderQuestion(step);
  if (step.kind === "review") return renderReview();
  if (step.kind === "submit") return renderSubmit();
}

// ============================================================
// Step Renderers
// ============================================================
function renderIntro() {
  const hasSaved = Object.keys(answers).length > 0;

  root.innerHTML = `
    <div class="intro-container">
      <div class="hero-banner-wrap">
        <img src="assets/hero.jpg" alt="Nirapod Personal Safety Study" class="hero-banner-img" onerror="this.style.display='none'">
        <div class="hero-overlay"></div>
      </div>
      <div>
        <span class="intro-tagline">CSE 4451 • HCI Research Study</span>
        <h1 class="intro-title">Help design a safer everyday.</h1>
      </div>
      <p class="intro-p">
        This study explores phone interactions during high-stress or unsafe situations in daily life — streets, parking lots, campus, home, public transit — to help build ergonomic, touch-friendly emergency features for personal safety.
      </p>

      <div class="badges-row">
        <span class="badge-item">⏱️ ~4 minutes</span>
        <span class="badge-item">📋 4 short sections</span>
        <span class="badge-item">🔒 Anonymous</span>
        <span class="badge-item">⚡ Hotkey enabled</span>
      </div>

      ${hasSaved ? `
        <div class="review-section-box" style="margin-top: 10px; background: rgba(16,185,129,0.08); border-color: var(--accent-teal);">
          <p style="font-size: 0.9rem; font-weight: 600; color: var(--accent-teal);">You have a saved survey in progress.</p>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">Would you like to resume where you left off or start fresh?</p>
        </div>
      ` : ""}

      <div class="nav-actions">
        ${hasSaved ? `<button class="btn-ghost" id="resetAnswersBtn">Start fresh</button>` : `<span></span>`}
        <button class="btn-primary" id="startBtn">
          ${hasSaved ? "Resume survey" : "Start survey"} 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById("startBtn").onclick = () => {
    if (hasSaved) {
      // Find first unanswered step or go to Q1
      let firstUnanswered = 1;
      for (let i = 1; i <= totalQuestions; i++) {
        const s = STEPS[i];
        if (isAnswerEmpty(s.q, answers[s.q.id])) {
          firstUnanswered = i;
          break;
        }
      }
      goStep(firstUnanswered);
    } else {
      go(1);
    }
  };

  const resetBtn = document.getElementById("resetAnswersBtn");
  if (resetBtn) {
    resetBtn.onclick = () => {
      clearSavedAnswers();
      render();
    };
  }
}

function renderQuestion(step) {
  const { q } = step;

  let bodyHtml = "";
  if (q.type === "radio" || q.type === "checkbox") {
    bodyHtml = renderChoiceOptions(q);
  } else if (q.type === "likert") {
    bodyHtml = renderLikert(q);
  } else if (q.type === "text") {
    const val = answers[q.id] || "";
    bodyHtml = `
      <div class="other-text-wrap">
        <textarea class="other-input-field" id="textInput" placeholder="Type your response here...">${escapeHtml(val)}</textarea>
      </div>`;
  }

  root.innerHTML = `
    <div class="q-header">
      <div class="q-eyebrow">
        <span>Section ${step.sectionIndex + 1} of ${SECTIONS.length}</span> • <span>${step.section.label}</span>
      </div>
      <h2 class="q-title">${q.title}</h2>
      ${q.help ? `<p class="q-help">${q.help}</p>` : ""}
    </div>

    ${q.image ? `<img class="question-image" src="${escapeAttr(q.image)}" alt="Emergency trigger preference illustration" onerror="this.style.display='none'">` : ""}

    <div class="q-body-container">${bodyHtml}</div>

    <div class="error-banner" id="errorMsg"></div>

    <div class="nav-actions">
      <button class="btn-ghost" id="backBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </button>
      <button class="btn-primary" id="nextBtn">
        ${currentStepIndex === STEPS.length - 3 ? "Review responses" : "Next"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  `;

  attachChoiceHandlers(q);

  document.getElementById("backBtn").onclick = () => go(-1);
  document.getElementById("nextBtn").onclick = () => tryAdvance(q);

  // Auto focus text field
  const textInput = document.getElementById("textInput");
  if (textInput) {
    textInput.addEventListener("input", (e) => {
      answers[q.id] = e.target.value.trim();
      saveAnswers();
    });
  }
}

function renderChoiceOptions(q) {
  const stored = answers[q.id] || (q.type === "checkbox" ? [] : { value: "", other: "" });
  const isChecked = (opt) => q.type === "checkbox" ? stored.includes(opt) : stored.value === opt;

  let html = `<div class="options-list">`;
  q.options.forEach((opt, i) => {
    const checked = isChecked(opt);
    const shortcutKey = i + 1 <= 9 ? i + 1 : "";

    html += `
      <label class="option-card ${q.type} ${checked ? "checked" : ""}" data-opt="${escapeAttr(opt)}">
        <div class="option-left">
          <div class="custom-indicator">
            ${q.type === "checkbox" ? (checked ? "✓" : "") : `<div class="indicator-dot"></div>`}
          </div>
          <span class="option-label-text">${escapeHtml(opt)}</span>
        </div>
        ${shortcutKey ? `<span class="kbd-badge">${shortcutKey}</span>` : ""}
        <input type="${q.type === "checkbox" ? "checkbox" : "radio"}" name="${q.id}" value="${escapeAttr(opt)}" ${checked ? "checked" : ""}>
      </label>`;
  });

  if (q.allowOther) {
    const otherChecked = q.type === "checkbox" ? stored.includes("Other") : stored.value === "Other";
    const otherVal = (q.type === "checkbox" ? stored.otherText : stored.other) || "";

    html += `
      <label class="option-card ${q.type} ${otherChecked ? "checked" : ""}" data-opt="Other">
        <div class="option-left">
          <div class="custom-indicator">
            ${q.type === "checkbox" ? (otherChecked ? "✓" : "") : `<div class="indicator-dot"></div>`}
          </div>
          <span class="option-label-text">Other (specify)</span>
        </div>
        <span class="kbd-badge">${q.options.length + 1}</span>
        <input type="${q.type === "checkbox" ? "checkbox" : "radio"}" name="${q.id}" value="Other" ${otherChecked ? "checked" : ""}>
      </label>
      <div class="other-text-wrap" id="otherWrap" style="display:${otherChecked ? "block" : "none"}">
        <input type="text" class="other-input-field" id="otherText" placeholder="Please specify your response..." value="${escapeAttr(otherVal)}">
      </div>`;
  }

  html += `</div>`;
  return html;
}

function renderLikert(q) {
  const stored = answers[q.id] || null;

  let html = `
    <div class="likert-container">
      <div class="likert-grid">`;

  for (let i = 1; i <= 5; i++) {
    const selected = stored === i;
    html += `
      <label class="likert-card ${selected ? "selected" : ""}" data-val="${i}">
        <div class="likert-num-pill">${i}</div>
        <span class="likert-card-cap">${i === 1 ? q.capLow : i === 5 ? q.capHigh : "&nbsp;"}</span>
        <input type="radio" name="${q.id}" value="${i}" ${selected ? "checked" : ""}>
      </label>`;
  }

  html += `
      </div>
      <div class="likert-feedback-label" id="likertFeedback">
        ${stored ? LIKERT_DESCRIPTORS[stored] : "Select 1 to 5 using keys or tap above"}
      </div>
    </div>`;

  return html;
}

// ============================================================
// Choice & Likert Event Handlers
// ============================================================
function attachChoiceHandlers(q) {
  if (q.type === "radio" || q.type === "checkbox") {
    const cards = root.querySelectorAll(".option-card");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.target.tagName === "INPUT" || e.target.id === "otherText") return;
        const input = card.querySelector("input");
        if (q.type === "checkbox") input.checked = !input.checked;
        else input.checked = true;
        syncChoiceUI(q);
      });
    });

    root.querySelectorAll(`input[name="${q.id}"]`).forEach((inp) => {
      inp.addEventListener("change", () => syncChoiceUI(q));
    });

    const otherText = document.getElementById("otherText");
    if (otherText) {
      otherText.addEventListener("input", () => {
        syncChoiceUI(q);
      });
    }
  } else if (q.type === "likert") {
    const cards = root.querySelectorAll(".likert-card");
    const feedback = document.getElementById("likertFeedback");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const val = parseInt(card.getAttribute("data-val"), 10);
        const input = card.querySelector("input");
        input.checked = true;

        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        if (feedback) feedback.textContent = LIKERT_DESCRIPTORS[val] || `${val}`;

        answers[q.id] = val;
        saveAnswers();
      });

      card.addEventListener("mouseenter", () => {
        const val = parseInt(card.getAttribute("data-val"), 10);
        if (feedback) feedback.textContent = LIKERT_DESCRIPTORS[val] || `${val}`;
      });
    });

    const container = root.querySelector(".likert-container");
    if (container) {
      container.addEventListener("mouseleave", () => {
        const currentVal = answers[q.id];
        if (feedback) {
          feedback.textContent = currentVal ? LIKERT_DESCRIPTORS[currentVal] : "Select 1 to 5 using keys or tap above";
        }
      });
    }
  }
}

function syncChoiceUI(q) {
  const cards = root.querySelectorAll(".option-card");
  cards.forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("checked", input.checked);
    const ind = card.querySelector(".custom-indicator");
    if (ind && q.type === "checkbox") {
      ind.textContent = input.checked ? "✓" : "";
    }
  });

  const otherInput = root.querySelector(`input[value="Other"]`);
  const otherWrap = document.getElementById("otherWrap");
  const otherText = document.getElementById("otherText");

  if (otherWrap && otherInput) {
    const isOtherSelected = otherInput.checked;
    otherWrap.style.display = isOtherSelected ? "block" : "none";
    if (isOtherSelected && otherText) {
      otherText.focus();
    }
  }

  // Update answer in state
  answers[q.id] = collectAnswer(q);
  saveAnswers();
}

function collectAnswer(q) {
  if (q.type === "text") {
    const input = document.getElementById("textInput");
    return input ? input.value.trim() : "";
  }
  if (q.type === "likert") {
    const checked = root.querySelector(`input[name="${q.id}"]:checked`);
    return checked ? parseInt(checked.value, 10) : null;
  }
  if (q.type === "radio") {
    const checked = root.querySelector(`input[name="${q.id}"]:checked`);
    const otherText = document.getElementById("otherText");
    return {
      value: checked ? checked.value : "",
      other: otherText ? otherText.value.trim() : ""
    };
  }
  if (q.type === "checkbox") {
    const checked = [...root.querySelectorAll(`input[name="${q.id}"]:checked`)].map((i) => i.value);
    const otherText = document.getElementById("otherText");
    const result = checked;
    result.otherText = otherText ? otherText.value.trim() : "";
    return result;
  }
}

function isAnswerEmpty(q, val) {
  if (!val) return true;
  if (q.type === "text") return val === "";
  if (q.type === "likert") return val === null;
  if (q.type === "radio") return !val.value;
  if (q.type === "checkbox") return !val || val.length === 0;
  return true;
}

function tryAdvance(q) {
  const val = collectAnswer(q);
  answers[q.id] = val;
  saveAnswers();

  const errorEl = document.getElementById("errorMsg");
  if (q.required && isAnswerEmpty(q, val)) {
    errorEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Please select or enter an answer before continuing.
    `;
    return;
  }
  errorEl.innerHTML = "";
  go(1);
}

function go(delta) {
  transitionDirection = delta > 0 ? "next" : "back";
  currentStepIndex = Math.max(0, Math.min(STEPS.length - 1, currentStepIndex + delta));
  render();
}

function goStep(targetIndex) {
  transitionDirection = targetIndex > currentStepIndex ? "next" : "back";
  currentStepIndex = Math.max(0, Math.min(STEPS.length - 1, targetIndex));
  toggleDrawer(false);
  render();
}

// ============================================================
// Review & Submission Screen
// ============================================================
function renderReview() {
  let sectionsHtml = "";

  SECTIONS.forEach((section, sIdx) => {
    sectionsHtml += `
      <div class="review-section-box">
        <div class="review-section-header">
          <span class="review-section-title">Section ${sIdx + 1}: ${section.label}</span>
          <button class="btn-ghost" style="padding: 4px 8px; font-size: 0.78rem;" onclick="goStep(${getSectionFirstStep(sIdx)})">
            Edit
          </button>
        </div>`;

    section.questions.forEach((q) => {
      const val = answers[q.id];
      const displayVal = flattenAnswer(q, val) || "<em>Not answered</em>";
      sectionsHtml += `
        <div class="review-item">
          <div class="review-q-title">${q.title}</div>
          <div class="review-q-ans">${displayVal}</div>
        </div>`;
    });

    sectionsHtml += `</div>`;
  });

  root.innerHTML = `
    <div class="review-container">
      <div class="q-header">
        <div class="q-eyebrow">Final Step • Verification</div>
        <h2 class="q-title">Review your responses</h2>
        <p class="q-help">Please verify your answers below. You can click 'Edit' on any section to make updates before submitting.</p>
      </div>

      ${sectionsHtml}

      <div class="nav-actions">
        <button class="btn-ghost" id="backBtn">Back</button>
        <button class="btn-primary" id="submitBtn">
          Submit responses
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById("backBtn").onclick = () => go(-1);
  document.getElementById("submitBtn").onclick = submitSurvey;
}

function getSectionFirstStep(sIdx) {
  let stepIdx = 1;
  for (let i = 1; i < STEPS.length; i++) {
    if (STEPS[i].kind === "question" && STEPS[i].sectionIndex === sIdx) {
      return i;
    }
  }
  return stepIdx;
}

function renderSubmit() {
  root.innerHTML = `
    <div class="status-card">
      <div class="spinner"></div>
      <h2 style="font-family: var(--font-heading); font-size: 1.5rem;">Recording responses…</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">Connecting securely to Google Apps Script backend.</p>
    </div>
  `;
}

async function submitSurvey() {
  currentStepIndex = STEPS.length - 1;
  renderSubmit();

  const payload = { submitted_at: new Date().toISOString() };
  SECTIONS.forEach((section) => {
    section.questions.forEach((q) => {
      const val = answers[q.id];
      payload[q.id] = flattenAnswer(q, val);
    });
  });

  try {
    if (!ENDPOINT_URL || ENDPOINT_URL.includes("PASTE_YOUR")) {
      throw new Error("NO_ENDPOINT");
    }

    const response = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid response from Google Apps Script (${response.status})`);
    }
    if (!response.ok || result.status !== "ok") {
      throw new Error(result.message || `Google Apps Script returned HTTP ${response.status}`);
    }

    clearSavedAnswers();
    renderDone(true);
  } catch (err) {
    renderDone(false, err.message === "NO_ENDPOINT");
  }
}

function flattenAnswer(q, val) {
  if (val == null) return "";
  if (q.type === "radio") {
    return val.value === "Other" && val.other ? `Other: ${val.other}` : val.value;
  }
  if (q.type === "checkbox") {
    const list = Array.isArray(val) ? [...val] : [];
    if (list.includes("Other") && val.otherText) {
      const idx = list.indexOf("Other");
      list[idx] = `Other: ${val.otherText}`;
    }
    return list.join("; ");
  }
  return val;
}

function renderDone(success, noEndpoint) {
  if (success) {
    root.innerHTML = `
      <div class="status-card">
        <div class="status-icon-ring">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700;">Thank you!</h2>
        <p style="color: var(--text-secondary); max-width: 440px; font-size: 0.95rem; line-height: 1.6;">
          Your response has been successfully recorded. Your input directly supports our research on intuitive, rapid-access emergency interface design.
        </p>
        <button class="btn-secondary" style="margin-top: 14px;" onclick="location.reload()">
          Submit another response
        </button>
      </div>
    `;
  } else {
    root.innerHTML = `
      <div class="status-card">
        <div class="status-icon-ring" style="border-color: var(--accent-coral); color: var(--accent-coral); background: var(--accent-coral-glow);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 700;">Submission Error</h2>
        <p style="color: var(--text-secondary); max-width: 440px; font-size: 0.9rem; line-height: 1.6;">
          ${noEndpoint
        ? "Backend URL is not configured yet. Open Backend Settings (⚙️ top right) or update ENDPOINT_URL in script.js."
        : "Could not send data to Google Sheets. Check your network or URL."}
        </p>
        <div style="display: flex; gap: 10px; margin-top: 12px;">
          <button class="btn-secondary" onclick="toggleSettings(true)">Configure URL</button>
          <button class="btn-primary" onclick="submitSurvey()">Retry Submission</button>
        </div>
      </div>
    `;
  }
}

// ============================================================
// Drawer Overview List Renderer
// ============================================================
function renderDrawerList() {
  let html = "";
  SECTIONS.forEach((sec, sIdx) => {
    html += `
      <div class="drawer-section-group">
        <div class="drawer-section-title">Section ${sIdx + 1}: ${sec.label}</div>`;

    sec.questions.forEach((q) => {
      // Find step index for this question
      const stepIdx = STEPS.findIndex((s) => s.kind === "question" && s.q.id === q.id);
      const isCurrent = currentStepIndex === stepIdx;
      const isDone = !isAnswerEmpty(q, answers[q.id]);

      html += `
        <div class="drawer-q-item ${isCurrent ? "current" : isDone ? "done" : ""}" onclick="goStep(${stepIdx})">
          <span>${q.title.length > 35 ? q.title.substring(0, 35) + "…" : q.title}</span>
          <span style="font-size: 0.75rem; opacity: 0.8;">${isCurrent ? "Active" : isDone ? "✓" : "Pending"}</span>
        </div>`;
    });

    html += `</div>`;
  });

  drawerList.innerHTML = html;
}

// ============================================================
// Global Event Listeners & Keyboard Navigation
// ============================================================
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.onclick = toggleTheme;

  // Drawer Toggle
  drawerToggleBtn.onclick = () => toggleDrawer();
  closeDrawerBtn.onclick = () => toggleDrawer(false);
  drawerOverlay.onclick = (e) => {
    if (e.target === drawerOverlay) toggleDrawer(false);
  };

  // Settings Modal Toggle
  settingsToggleBtn.onclick = () => toggleSettings();
  closeSettingsBtn.onclick = () => toggleSettings(false);
  settingsModal.onclick = (e) => {
    if (e.target === settingsModal) toggleSettings(false);
  };

  saveEndpointBtn.onclick = () => {
    const val = endpointInput.value.trim();
    if (val) {
      ENDPOINT_URL = val;
      localStorage.setItem("nirapod_endpoint", val);
      endpointStatus.innerHTML = `<span style="color: var(--accent-teal);">Saved successfully!</span>`;
      setTimeout(() => toggleSettings(false), 800);
    }
  };

  testEndpointBtn.onclick = async () => {
    const val = endpointInput.value.trim();
    if (!val) {
      endpointStatus.innerHTML = `<span style="color: var(--accent-coral);">Please enter a URL first.</span>`;
      return;
    }
    endpointStatus.innerHTML = `<span style="color: var(--text-secondary);">Testing connection…</span>`;
    try {
      const res = await fetch(val, { method: "GET" });
      const data = await res.json();
      if (data.status === "ok") {
        endpointStatus.innerHTML = `<span style="color: var(--accent-teal);">✓ Web App live: ${data.message}</span>`;
      } else {
        endpointStatus.innerHTML = `<span style="color: var(--accent-coral);">Received unexpected response.</span>`;
      }
    } catch (e) {
      endpointStatus.innerHTML = `<span style="color: var(--accent-coral);">CORS/Network warning (Normal for Apps Script POST endpoints). Endpoint saved.</span>`;
    }
  };

  // Global Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    // Ignore keypresses if modal/drawer or text input is active
    if (drawerOverlay.classList.contains("active") || settingsModal.classList.contains("active")) return;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") && activeEl.type !== "radio" && activeEl.type !== "checkbox") {
      if (e.key === "Enter" && activeEl.tagName !== "TEXTAREA") {
        e.preventDefault();
        const step = STEPS[currentStepIndex];
        if (step.kind === "question") tryAdvance(step.q);
      }
      return;
    }

    const step = STEPS[currentStepIndex];

    if (e.key === "Enter") {
      e.preventDefault();
      if (step.kind === "intro") go(1);
      else if (step.kind === "question") tryAdvance(step.q);
      else if (step.kind === "review") submitSurvey();
      return;
    }

    if (e.key === "Escape" || e.key === "ArrowLeft") {
      if (currentStepIndex > 0 && step.kind !== "submit") {
        e.preventDefault();
        go(-1);
        return;
      }
    }

    // Number key shortcuts
    if (step.kind === "question") {
      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        if (step.q.type === "likert" && keyNum <= 5) {
          const card = root.querySelector(`.likert-card[data-val="${keyNum}"]`);
          if (card) card.click();
        } else if (step.q.type === "radio" || step.q.type === "checkbox") {
          const cards = root.querySelectorAll(".option-card");
          if (cards[keyNum - 1]) cards[keyNum - 1].click();
        }
      }
    }
  });
}

// Helpers
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

// Boot Application
init();
