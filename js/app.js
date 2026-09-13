/* ===========================================================
   Constantes & helpers
   =========================================================== */
const STORAGE_KEY = "zen_state_v1";
const USER_NAME = "Valentin";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function defaultState() {
  return {
    settings: { theme: "dark", lang: "fr", wallpaper: null },
    labels: { notes: null, projects: null, motivation: null },
    notes: [],
    projects: [],
    quotes: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      settings: { ...base.settings, ...(parsed.settings || {}) },
      labels: { ...base.labels, ...(parsed.labels || {}) },
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
    };
  } catch (e) {
    console.warn("Lecture du stockage impossible, réinitialisation.", e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Sauvegarde impossible (stockage plein ?)", e);
    showToast(state.settings.lang === "fr" ? "Stockage plein, impossible d'enregistrer" : "Storage full, could not save");
  }
}

let state = loadState();
const ui = {
  screen: "screen-home",
  noteEditId: null,
  notesListMode: null,     // 'all' | 'important'
  labelEditMenu: null,     // 'notes' | 'projects' | 'motivation'
  currentProjectId: null,
};

function compressImage(file, maxDim = 1600, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ===========================================================
   Montres — construction + tick en temps réel
   =========================================================== */
const WATCH_DEFS = {
  chrono: { brandName: "MAISON D'OR", brandSub: "GENÈVE", dateWindow: true },
  black: { brandName: "MDG", brandSub: "MAISON D'OR", dateWindow: false },
  skeleton: { brandName: "MDG", brandSub: "MAISON D'OR", dateWindow: false, gearDeco: true },
  navy: { brandName: "MDG", brandSub: "MAISON D'OR", dateWindow: false },
};

function initWatch(container) {
  if (!container) return;
  const variantKey = [...container.classList].find((c) => c.startsWith("watch--"))?.replace("watch--", "");
  const def = WATCH_DEFS[variantKey];
  if (!def) return;
  const isHero = container.classList.contains("hero");
  container.innerHTML = "";

  const dial = document.createElement("div");
  dial.className = "watch-dial";
  container.appendChild(dial);

  if (def.gearDeco) {
    ["g1", "g2", "g3"].forEach((g) => {
      const d = document.createElement("div");
      d.className = "gear-deco " + g;
      container.appendChild(d);
    });
  }

  if (isHero) {
    for (let i = 0; i < 12; i++) {
      if ([0, 3, 6, 9].includes(i)) continue;
      const wrap = document.createElement("div");
      wrap.className = "tick-wrap";
      wrap.style.transform = `rotate(${i * 30}deg)`;
      const tick = document.createElement("div");
      tick.className = "watch-tick";
      wrap.appendChild(tick);
      container.appendChild(wrap);
    }
  }

  const radius = isHero ? 40 : 37;
  const positions = { 0: [50, 50 - radius], 3: [50 + radius, 50], 6: [50, 50 + radius], 9: [50 - radius, 50] };
  const numeralText = { 0: "12", 3: "3", 6: "6", 9: "9" };
  Object.keys(positions).forEach((k) => {
    const [x, y] = positions[k];
    const n = document.createElement("div");
    n.className = "watch-numeral";
    n.style.left = x + "%";
    n.style.top = y + "%";
    n.textContent = numeralText[k];
    container.appendChild(n);
  });

  const brand = document.createElement("div");
  brand.className = "watch-brand";
  brand.innerHTML = `<span class="b-name">${def.brandName}</span><span class="b-sub">${def.brandSub}</span>`;
  container.appendChild(brand);

  if (def.dateWindow && isHero) {
    const dw = document.createElement("div");
    dw.className = "watch-date";
    dw.setAttribute("data-date-window", "1");
    dw.textContent = "--";
    container.appendChild(dw);
  }

  ["hour", "minute", "second"].forEach((cls) => {
    const h = document.createElement("div");
    h.className = "watch-hand " + cls;
    container.appendChild(h);
  });

  const cap = document.createElement("div");
  cap.className = "watch-cap";
  container.appendChild(cap);

  const bezel = document.createElement("div");
  bezel.className = "watch-bezel";
  container.appendChild(bezel);
}

function initAllWatches() {
  $$(".watch").forEach(initWatch);
}

function tickClocks() {
  const now = new Date();
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourDeg = (h + m / 60) * 30;
  const minDeg = (m + s / 60) * 6;
  const secDeg = s * 6;

  $$(".watch-hand.hour").forEach((el) => (el.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`));
  $$(".watch-hand.minute").forEach((el) => (el.style.transform = `translateX(-50%) rotate(${minDeg}deg)`));
  $$(".watch-hand.second").forEach((el) => (el.style.transform = `translateX(-50%) rotate(${secDeg}deg)`));
  $$(".watch-date[data-date-window]").forEach((el) => (el.textContent = String(now.getDate())));

  const locale = state.settings.lang === "fr" ? "fr-FR" : "en-US";
  const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  ["notes-time", "projects-time", "zen-time"].forEach((id) => {
    const el = $("#" + id);
    if (el) el.textContent = timeStr;
  });
}

/* ===========================================================
   Ecran de lancement
   =========================================================== */
function initSparkles() {
  const container = $("#sparkles");
  if (!container) return;
  const colors = ["#7fb4ff", "#9be8c9", "#cba869", "#c084fc"];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("div");
    s.className = "sparkle";
    const size = 4 + Math.random() * 10;
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = 45 + Math.random() * 48 + "%";
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    s.style.animationDelay = Math.random() * 2 + "s";
    container.appendChild(s);
  }
}

function initSplash() {
  initSparkles();
  setTimeout(() => {
    const el = $("#splash");
    if (!el) return;
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 550);
  }, 1400);
}

/* ===========================================================
   i18n & thème
   =========================================================== */
function applyI18n() {
  const lang = state.settings.lang;
  $$("[data-i18n]").forEach((el) => (el.textContent = tr(lang, el.dataset.i18n)));
  $$("[data-i18n-placeholder]").forEach((el) => (el.placeholder = tr(lang, el.dataset.i18nPlaceholder)));
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.settings.theme);
}

function applyWallpaper() {
  if (state.settings.wallpaper) {
    document.documentElement.style.setProperty("--wallpaper", `url("${state.settings.wallpaper}")`);
    const thumb = $("#wallpaper-thumb");
    if (thumb) thumb.src = state.settings.wallpaper;
  } else {
    document.documentElement.style.removeProperty("--wallpaper");
    const thumb = $("#wallpaper-thumb");
    if (thumb) thumb.src = "assets/wallpaper-default.jpg";
  }
}

/* ===========================================================
   Rendu — Menu 1 (accueil)
   =========================================================== */
function renderHome() {
  $("#home-hello").textContent = tr(state.settings.lang, "greeting", USER_NAME);
}

/* ===========================================================
   Rendu — Menu 2 (notes)
   =========================================================== */
function labelFor(menu) {
  const lang = state.settings.lang;
  return state.labels[menu] || tr(lang, "default_label_" + menu);
}

function renderNotes() {
  const lang = state.settings.lang;
  $("#notes-label-text").textContent = labelFor("notes");
  const sorted = [...state.notes].sort((a, b) => b.ts - a.ts);
  const container = $("#notes-recent-list");
  container.innerHTML = "";
  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state">${tr(lang, "no_notes")}</div>`;
  } else {
    sorted.slice(0, 7).forEach((n) => container.appendChild(buildNoteRow(n)));
  }
}

function buildNoteRow(note) {
  const row = document.createElement("div");
  row.className = "list-item";
  row.innerHTML = `
    <button class="li-toggle${note.important ? " on" : ""}" data-action="toggle-important" data-id="${note.id}" aria-label="Idée importante"></button>
    <div class="li-text tappable" data-action="edit-note" data-id="${note.id}">${escapeHtml(note.text)}</div>
    <button class="li-delete" data-action="delete-note" data-id="${note.id}" aria-label="Supprimer">×</button>
  `;
  return row;
}

function openNotesListSheet(mode) {
  ui.notesListMode = mode;
  const lang = state.settings.lang;
  $("#notes-list-title").textContent = tr(lang, mode === "important" ? "important_ideas" : "all_notes");
  refreshNotesListSheet();
  openSheet("notes-list");
}

function refreshNotesListSheet() {
  if (!ui.notesListMode) return;
  const lang = state.settings.lang;
  const filtered = state.notes.filter((n) => (ui.notesListMode === "important" ? n.important : true));
  const sorted = filtered.sort((a, b) => b.ts - a.ts);
  const container = $("#notes-list-content");
  container.innerHTML = "";
  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state">${tr(lang, ui.notesListMode === "important" ? "no_important" : "no_notes")}</div>`;
  } else {
    sorted.forEach((n) => container.appendChild(buildNoteRow(n)));
  }
}

/* ===========================================================
   Rendu — Menu 3 (projets)
   =========================================================== */
function renderProjects() {
  const lang = state.settings.lang;
  $("#projects-label-text").textContent = labelFor("projects");
  const sorted = [...state.projects].sort((a, b) => b.ts - a.ts);
  const container = $("#projects-list");
  container.innerHTML = "";
  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state">${tr(lang, "no_projects")}</div>`;
  } else {
    sorted.forEach((p) => {
      const row = document.createElement("div");
      row.className = "folder-row tappable";
      row.setAttribute("data-action", "open-project");
      row.setAttribute("data-id", p.id);
      row.innerHTML = `<span>${escapeHtml(p.name)}</span><span style="opacity:.7;font-size:12px;">${p.items.length}</span>`;
      container.appendChild(row);
    });
  }
}

function openProjectDetail(id) {
  const project = state.projects.find((p) => p.id === id);
  if (!project) return;
  ui.currentProjectId = id;
  $("#project-detail-title").textContent = project.name;
  $("#project-note-input").value = "";
  renderProjectItems();
  openSheet("project-detail");
}

function renderProjectItems() {
  const lang = state.settings.lang;
  const project = state.projects.find((p) => p.id === ui.currentProjectId);
  const container = $("#project-items-list");
  container.innerHTML = "";
  if (!project || project.items.length === 0) {
    container.innerHTML = `<div class="empty-state">${tr(lang, "no_project_items")}</div>`;
    return;
  }
  [...project.items].sort((a, b) => b.ts - a.ts).forEach((item) => {
    const row = document.createElement("div");
    row.className = "project-item-row";
    if (item.type === "photo") {
      row.innerHTML = `<img src="${item.content}" alt=""><div class="pi-text"></div><button class="li-delete" data-action="delete-project-item" data-id="${item.id}">×</button>`;
    } else {
      row.innerHTML = `<div class="pi-text">${escapeHtml(item.content)}</div><button class="li-delete" data-action="delete-project-item" data-id="${item.id}">×</button>`;
    }
    container.appendChild(row);
  });
}

/* ===========================================================
   Rendu — Menu 4 (motivation)
   =========================================================== */
function renderMotivation() {
  const lang = state.settings.lang;
  $("#motivation-label-text").textContent = labelFor("motivation");
  const sorted = [...state.quotes].sort((a, b) => b.ts - a.ts);
  const container = $("#quotes-list");
  container.innerHTML = "";
  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state">${tr(lang, "no_quotes")}</div>`;
  } else {
    sorted.forEach((q) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `<div class="li-text">${escapeHtml(q.text)}</div><button class="li-delete" data-action="delete-quote" data-id="${q.id}">×</button>`;
      container.appendChild(row);
    });
  }
}

/* ===========================================================
   Rendu — Réglages
   =========================================================== */
function renderSettings() {
  $$(".swatch").forEach((s) => s.classList.toggle("selected", s.dataset.theme === state.settings.theme));
  $$(".chip[data-lang]").forEach((c) => c.classList.toggle("selected", c.dataset.lang === state.settings.lang));
}

/* ===========================================================
   Sheets & toasts
   =========================================================== */
function openSheet(name) {
  $$(".sheet").forEach((s) => (s.style.display = "none"));
  const sheet = document.querySelector(`.sheet[data-sheet="${name}"]`);
  if (sheet) sheet.style.display = "block";
  $("#overlay").classList.add("active");
}
function closeSheet() {
  $("#overlay").classList.remove("active");
}

let toastTimer = null;
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ===========================================================
   Navigation
   =========================================================== */
function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $("#" + id).classList.add("active");
  ui.screen = id;
  $("#bottom-nav").classList.toggle("compact", id !== "screen-home");
  $("#nav-zen-btn").classList.toggle("active", id === "screen-zen");
  $("#nav-settings-btn").classList.toggle("active", id === "screen-settings");
}

function renderAll() {
  applyI18n();
  renderHome();
  renderNotes();
  renderProjects();
  renderMotivation();
  renderSettings();
}

/* ===========================================================
   Gestion centralisée des actions
   =========================================================== */
function handleAction(e) {
  const el = e.target.closest("[data-action]");
  if (!el) {
    if (e.target.id === "overlay") closeSheet();
    return;
  }
  const lang = state.settings.lang;
  const action = el.dataset.action;

  switch (action) {
    case "go-home":
      showScreen("screen-home");
      break;
    case "go-notes":
      showScreen("screen-notes");
      renderNotes();
      break;
    case "go-projects":
      showScreen("screen-projects");
      renderProjects();
      break;
    case "go-motivation":
      showScreen("screen-motivation");
      renderMotivation();
      break;
    case "go-settings":
      showScreen("screen-settings");
      renderSettings();
      break;
    case "go-zen":
      showScreen(ui.screen === "screen-zen" ? "screen-home" : "screen-zen");
      break;

    case "add-note":
      ui.noteEditId = null;
      $("#note-input").value = "";
      $("#note-delete-btn").style.display = "none";
      $("#note-sheet-title").textContent = tr(lang, "new_note");
      openSheet("note");
      break;
    case "edit-note": {
      const note = state.notes.find((n) => n.id === el.dataset.id);
      if (!note) return;
      ui.noteEditId = note.id;
      $("#note-input").value = note.text;
      $("#note-delete-btn").style.display = "inline-block";
      $("#note-sheet-title").textContent = tr(lang, "edit_note");
      openSheet("note");
      break;
    }
    case "save-note": {
      const text = $("#note-input").value.trim();
      if (!text) { showToast(tr(lang, "toast_missing_text")); return; }
      if (ui.noteEditId) {
        const note = state.notes.find((n) => n.id === ui.noteEditId);
        if (note) note.text = text;
        showToast(tr(lang, "toast_note_saved"));
      } else {
        state.notes.push({ id: uid(), text, important: false, ts: Date.now() });
        showToast(tr(lang, "toast_note_added"));
      }
      saveState();
      closeSheet();
      renderNotes();
      refreshNotesListSheet();
      break;
    }
    case "delete-note":
      e.stopPropagation();
      state.notes = state.notes.filter((n) => n.id !== el.dataset.id);
      saveState();
      renderNotes();
      refreshNotesListSheet();
      showToast(tr(lang, "toast_note_deleted"));
      break;
    case "toggle-important": {
      const note = state.notes.find((n) => n.id === el.dataset.id);
      if (note) { note.important = !note.important; saveState(); renderNotes(); refreshNotesListSheet(); }
      break;
    }
    case "open-all-notes":
      openNotesListSheet("all");
      break;
    case "open-important":
      openNotesListSheet("important");
      break;

    case "edit-label": {
      ui.labelEditMenu = el.dataset.menu;
      $("#label-input").value = labelFor(ui.labelEditMenu);
      openSheet("label-edit");
      break;
    }
    case "save-label": {
      const val = $("#label-input").value.trim();
      state.labels[ui.labelEditMenu] = val || null;
      saveState();
      if (ui.labelEditMenu === "notes") renderNotes();
      if (ui.labelEditMenu === "projects") renderProjects();
      if (ui.labelEditMenu === "motivation") renderMotivation();
      closeSheet();
      showToast(tr(lang, "toast_label_saved"));
      break;
    }

    case "add-project":
      $("#project-name-input").value = "";
      openSheet("project-new");
      break;
    case "save-project": {
      const name = $("#project-name-input").value.trim();
      if (!name) { showToast(tr(lang, "toast_missing_text")); return; }
      state.projects.push({ id: uid(), name, items: [], ts: Date.now() });
      saveState();
      closeSheet();
      renderProjects();
      showToast(tr(lang, "toast_project_added"));
      break;
    }
    case "open-project":
      openProjectDetail(el.dataset.id);
      break;
    case "add-project-note": {
      const text = $("#project-note-input").value.trim();
      if (!text) { showToast(tr(lang, "toast_missing_text")); return; }
      const project = state.projects.find((p) => p.id === ui.currentProjectId);
      if (project) {
        project.items.push({ id: uid(), type: "text", content: text, ts: Date.now() });
        saveState();
        $("#project-note-input").value = "";
        renderProjectItems();
        renderProjects();
        showToast(tr(lang, "toast_project_item_added"));
      }
      break;
    }
    case "add-project-photo":
      $("#project-photo-input").click();
      break;
    case "delete-project-item": {
      const project = state.projects.find((p) => p.id === ui.currentProjectId);
      if (project) {
        project.items = project.items.filter((it) => it.id !== el.dataset.id);
        saveState();
        renderProjectItems();
        renderProjects();
      }
      break;
    }
    case "delete-project":
      state.projects = state.projects.filter((p) => p.id !== ui.currentProjectId);
      saveState();
      closeSheet();
      renderProjects();
      showToast(tr(lang, "toast_project_deleted"));
      break;

    case "add-quote":
      $("#quote-input").value = "";
      openSheet("quote");
      break;
    case "save-quote": {
      const text = $("#quote-input").value.trim();
      if (!text) { showToast(tr(lang, "toast_missing_text")); return; }
      state.quotes.push({ id: uid(), text, ts: Date.now() });
      saveState();
      closeSheet();
      renderMotivation();
      showToast(tr(lang, "toast_quote_added"));
      break;
    }
    case "delete-quote":
      state.quotes = state.quotes.filter((q) => q.id !== el.dataset.id);
      saveState();
      renderMotivation();
      showToast(tr(lang, "toast_quote_deleted"));
      break;

    case "set-theme":
      state.settings.theme = el.dataset.theme;
      saveState();
      applyTheme();
      renderSettings();
      break;
    case "set-lang":
      state.settings.lang = el.dataset.lang;
      saveState();
      document.documentElement.lang = state.settings.lang;
      renderAll();
      break;
    case "change-wallpaper":
      $("#wallpaper-input").click();
      break;
    case "reset-wallpaper":
      state.settings.wallpaper = null;
      saveState();
      applyWallpaper();
      showToast(tr(lang, "toast_wallpaper_reset"));
      break;

    case "close-sheet":
      closeSheet();
      break;
  }
}

function handleWallpaperInputChange(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  compressImage(file, 1800, 0.75).then((dataUrl) => {
    state.settings.wallpaper = dataUrl;
    saveState();
    applyWallpaper();
    showToast(tr(state.settings.lang, "toast_wallpaper_saved"));
  });
}

function handleProjectPhotoInputChange(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  compressImage(file, 1200, 0.7).then((dataUrl) => {
    const project = state.projects.find((p) => p.id === ui.currentProjectId);
    if (project) {
      project.items.push({ id: uid(), type: "photo", content: dataUrl, ts: Date.now() });
      saveState();
      renderProjectItems();
      renderProjects();
      showToast(tr(state.settings.lang, "toast_project_item_added"));
    }
  });
}

/* ===========================================================
   Service worker
   =========================================================== */
function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}

/* ===========================================================
   Initialisation
   =========================================================== */
function init() {
  applyTheme();
  applyWallpaper();
  document.documentElement.lang = state.settings.lang;
  initAllWatches();
  tickClocks();
  setInterval(tickClocks, 1000);
  renderAll();
  initSplash();

  document.addEventListener("click", handleAction);
  $("#wallpaper-input").addEventListener("change", handleWallpaperInputChange);
  $("#project-photo-input").addEventListener("change", handleProjectPhotoInputChange);
  registerSW();
}

document.addEventListener("DOMContentLoaded", init);
