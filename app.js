// Outer Mind Mini App. Сторінка публічна: жодних токенів і даних тут немає.
// Дані дає API бота; він пускає лише власника, перевіряючи підпис Telegram.WebApp.initData.
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// ---------- адреса API ----------
// Бот працює на ноуті за тунелем (ngrok або Cloudflare). Його хост бот передає параметром:
// ?api=… (кнопка «Хаб») або startapp=… (посилання /app), закодованим base64url, бо startapp не дозволяє крапок.
function apiBase() {
  const value = new URLSearchParams(location.search).get("api") || tg?.initDataUnsafe?.start_param || "";
  if (!value) return "";
  if (value.startsWith("http")) return value.replace(/\/$/, ""); // локальна розробка
  try {
    const host = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? `https://${host}` : "";
  } catch {
    return "";
  }
}
const API = apiBase();

async function api(method, path, body) {
  const response = await fetch(API + path, {
    method,
    headers: {
      Authorization: `tma ${tg?.initData || ""}`,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1", // інакше безкоштовний ngrok віддає сторінку-попередження
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Помилка ${response.status}`);
  return data;
}

// ---------- стан ----------
const state = {
  tasks: [],
  priorities: [],
  categories: [],
  filter: "urgent",
  list: "buy",
  add: { priority: "normal", category: "" },
  editing: null,
};
const $ = (id) => document.getElementById(id);
const haptic = (type) => tg?.HapticFeedback?.notificationOccurred(type);

function banner(text) {
  $("banner").textContent = text;
  $("banner").hidden = !text;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function chips(container, items, current, onPick) {
  container.replaceChildren(...items.map(({ key, label }) => {
    const button = el("button", key === current ? "on" : "", label);
    button.type = "button";
    button.onclick = () => onPick(key);
    return button;
  }));
}

const priorityItems = () => state.priorities.map((p) => ({ key: p.key, label: `${p.icon} ${p.name}` }));
const categoryLabel = (key) => state.categories.find((c) => c.key === key)?.label || "";
const priorityIcon = (key) => state.priorities.find((p) => p.key === key)?.icon || "";

// ---------- список ----------
function visibleTasks() {
  if (state.filter === "urgent") return state.tasks.filter((t) => t.urgent);
  if (state.filter === "lists") return state.tasks.filter((t) => t.category === state.list);
  return state.tasks;
}

function taskItem(task) {
  const li = el("li", "task");
  const check = el("button", "check");
  check.type = "button";
  check.setAttribute("aria-label", "Виконати");
  check.onclick = (event) => { event.stopPropagation(); complete(task, li); };

  const body = el("div", "body");
  body.append(el("div", "title", `${priorityIcon(task.priority)} ${task.title}`));
  const meta = [];
  if (task.category !== "other") meta.push(categoryLabel(task.category));
  if (task.deadline_label) meta.push(task.deadline_label);
  if (task.recurrence_label) meta.push(`🔁 ${task.recurrence_label}`);
  if (meta.length) body.append(el("div", "meta" + (task.overdue ? " overdue" : ""), meta.join(" · ")));
  if (task.comment) body.append(el("div", "comment", `💬 ${task.comment}`));

  li.append(check, body);
  li.onclick = () => openEditor(task);
  return li;
}

function render() {
  const tasks = visibleTasks();
  $("task-list").replaceChildren(...tasks.map(taskItem));
  const urgent = state.tasks.filter((t) => t.urgent).length;
  const overdue = state.tasks.filter((t) => t.overdue).length;
  $("summary").textContent = state.tasks.length
    ? `🔥 Термінових: ${urgent}` + (overdue ? ` · ⚠️ прострочених: ${overdue}` : "") + ` · усього: ${state.tasks.length}`
    : "";
  $("empty").hidden = tasks.length > 0;
  $("empty").textContent = state.filter === "urgent" && state.tasks.length
    ? "Термінових задач немає 🎉" : "Тут порожньо 🎉";

  $("list-chips").hidden = state.filter !== "lists";
  chips($("list-chips"), state.categories.map((c) => ({
    key: c.key, label: `${c.label} · ${state.tasks.filter((t) => t.category === c.key).length}`,
  })), state.list, (key) => { state.list = key; render(); });

  chips($("add-priority"), priorityItems(), state.add.priority, (key) => { state.add.priority = key; render(); });
  chips($("add-category"), [{ key: "", label: "🪄 Сам визначу" }, ...state.categories], state.add.category,
    (key) => { state.add.category = key; render(); });
}

async function load() {
  if (!API) {
    banner("Відкрий застосунок кнопкою «Хаб» у чаті з ботом або командою /app у групі: так він дізнається, де бот.");
    return;
  }
  try {
    const data = await api("GET", "/api/tasks");
    Object.assign(state, { tasks: data.tasks, priorities: data.priorities, categories: data.categories });
    banner("");
    render();
  } catch (error) {
    banner(error instanceof TypeError
      ? "Бот офлайн: ноут вимкнено або бот не запущено. Спробуй пізніше."
      : error.message);
  }
}

// ---------- дії ----------
let toastTimer;
function toast(text, onUndo) {
  $("toast-text").textContent = text;
  $("toast-undo").hidden = !onUndo;
  $("toast-undo").onclick = async () => { $("toast").hidden = true; await onUndo(); };
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").hidden = true; }, 4000);
}

async function run(action) {
  try {
    await action();
  } catch (error) {
    haptic("error");
    toast(error instanceof TypeError ? "Бот офлайн" : error.message);
  }
}

function complete(task, li) {
  li.classList.add("leaving");
  run(async () => {
    const result = await api("POST", `/api/tasks/${task.id}/done`);
    haptic("success");
    const next = result.next ? ` · наступна ${result.next.deadline.slice(8, 10)}.${result.next.deadline.slice(5, 7)}` : "";
    toast(`✅ ${task.title}${next}`, () => run(async () => {
      await api("POST", `/api/tasks/${task.id}/undo`);
      await load();
    }));
    await load();
  }).finally(() => li.classList.remove("leaving"));
}

$("add-title").addEventListener("focus", () => { $("add-extra").hidden = false; });
$("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("add-title").value.trim();
  if (!title) return;
  run(async () => {
    await api("POST", "/api/tasks", {
      title, priority: state.add.priority, category: state.add.category || null,
    });
    haptic("success");
    $("add-title").value = "";
    $("add-extra").hidden = true;
    state.add = { priority: "normal", category: "" };
    $("add-title").blur();
    await load();
  });
});

document.querySelectorAll("#filters button").forEach((button) => {
  button.onclick = () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("#filters button").forEach((b) => b.classList.toggle("on", b === button));
    tg?.HapticFeedback?.selectionChanged();
    render();
  };
});

// ---------- налаштування задачі ----------
function editorChips() {
  const e = state.editing;
  chips($("e-priority"), priorityItems(), e.priority, (key) => { e.priority = key; editorChips(); });
  chips($("e-category"), state.categories, e.category, (key) => { e.category = key; editorChips(); });
}

// Пункт списку «Повторення» для правила: weekly/monthly — лише якщо збігаються з днем дедлайну, як їх ставить бот
function recurrenceChoice(task) {
  const rule = task.recurrence;
  if (!rule) return "none";
  if (rule === "daily") return "daily";
  const day = new Date(task.deadline.slice(0, 10) + "T12:00:00");
  if (rule === `weekly:${day.getDay() || 7}`) return "weekly";
  if (rule === `monthly:${day.getDate()}`) return "monthly";
  return "other";
}

function openEditor(task) {
  state.editing = { ...task };
  $("e-title").value = task.title;
  $("e-date").value = task.deadline ? task.deadline.slice(0, 10) : "";
  $("e-time").value = task.deadline && task.deadline.length > 10 ? task.deadline.slice(11, 16) : "";
  $("e-rec").value = recurrenceChoice(task);
  $("e-rec-text").value = $("e-rec").value === "other" ? task.recurrence_label : "";
  $("e-rec-text").hidden = $("e-rec").value !== "other";
  $("e-comment").value = task.comment || "";
  $("e-error").hidden = true;
  editorChips();
  $("sheet").hidden = false;
  tg?.BackButton?.show();
}

function closeEditor() {
  $("sheet").hidden = true;
  state.editing = null;
  tg?.BackButton?.hide();
}

$("e-rec").onchange = () => { $("e-rec-text").hidden = $("e-rec").value !== "other"; };
$("e-nodate").onclick = () => { $("e-date").value = ""; $("e-time").value = ""; };
$("sheet").addEventListener("click", (event) => { if (event.target === $("sheet")) closeEditor(); });
tg?.BackButton?.onClick(closeEditor);

$("edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const e = state.editing;
  const date = $("e-date").value;
  const deadline = date ? date + ($("e-time").value ? ` ${$("e-time").value}` : "") : null;
  const recChoice = $("e-rec").value;
  const changes = {
    title: $("e-title").value,
    priority: e.priority,
    category: e.category,
    deadline,
    comment: $("e-comment").value,
  };
  // Повторення надсилаємо, лише якщо його змінили: інакше «щотижня (пн, чт)» не перетвориться на «щотижня»
  const original = recurrenceChoice(e);
  const recText = $("e-rec-text").value.trim();
  if (recChoice !== original || (recChoice === "other" && recText !== (e.recurrence_label || ""))) {
    changes.recurrence = recChoice === "other" ? recText : recChoice;
  }
  try {
    await api("PATCH", `/api/tasks/${e.id}`, changes);
    haptic("success");
    closeEditor();
    await load();
  } catch (error) {
    haptic("error");
    $("e-error").textContent = error instanceof TypeError ? "Бот офлайн" : error.message;
    $("e-error").hidden = false;
  }
});

$("e-delete").onclick = () => {
  const task = state.editing;
  const remove = () => run(async () => {
    await api("DELETE", `/api/tasks/${task.id}`);
    haptic("warning");
    closeEditor();
    await load();
  });
  if (tg?.showConfirm) tg.showConfirm(`Видалити «${task.title}»?`, (ok) => ok && remove());
  else if (confirm(`Видалити «${task.title}»?`)) remove();
};

// ---------- вкладки ----------
const tabs = document.querySelectorAll(".tabs button");
tabs.forEach((button) => {
  button.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.toggle("on", b === button));
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === button.dataset.screen));
    tg?.HapticFeedback?.selectionChanged();
  });
});

// Дані могли змінитись у групі, поки застосунок був згорнутий
document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
load();
