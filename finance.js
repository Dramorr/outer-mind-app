// Вкладка «Фінанси». Спільні api(), el(), chips(), toast(), run(), haptic() — з app.js.
// Суми від API — копійки (мінус = витрата).

const fin = {
  data: null,
  month: "",         // "" — поточний
  kind: "spent",
  group: "days",     // операції: days — по днях, stores — по магазинах
  addCategory: "",
  loaded: false,
};

function money(kop, sign = false) {
  const abs = Math.abs(kop) / 100;
  let s = abs.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, " ");
  if (s.endsWith(",00")) s = s.slice(0, -3);
  const prefix = sign ? (kop < 0 ? "−" : "+") : "";
  return `${prefix}${s} ₴`;
}

const catLabel = (key) => fin.data?.categories.find((c) => c.key === key)?.label || key;
const catIcon = (key) => catLabel(key).split(" ")[0];
const MONTHS = ["січень", "лютий", "березень", "квітень", "травень", "червень",
  "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];

function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function barFill(node, part, total) {
  const pct = total ? Math.min(100, Math.round((100 * part) / total)) : 0;
  node.style.width = `${pct}%`;
  node.className = part > total && total ? "over" : pct >= 80 ? "warn" : "";
}

// ---------- завантаження ----------
async function loadFinance() {
  if (!API) return;
  try {
    fin.data = await api("GET", "/api/finance" + (fin.month ? `?month=${fin.month}` : ""));
    fin.loaded = true;
    banner("");
    renderFinance();
  } catch (error) {
    banner(error instanceof TypeError ? "Бот офлайн: ноут вимкнено або бот не запущено. Спробуй пізніше." : error.message);
  }
}

// ---------- рендер ----------
function opItem(tx, { pending = false } = {}) {
  const li = el("li", "op" + (tx.excluded ? " muted-op" : "") + (pending ? " pending-op" : ""));
  li.append(el("span", "ico", tx.source === "cash" ? "💵" : catIcon(tx.category)));
  const body = el("div", "body");
  body.append(el("div", "place", tx.description || tx.comment || (tx.source === "cash" ? "Готівка" : "—")));
  const time = new Date(tx.time * 1000);
  const hhmm = time.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  body.append(el("div", "cat", `${catLabel(tx.category)} · ${hhmm}`));
  li.append(body, el("span", "sum" + (tx.amount > 0 ? " plus" : ""), money(tx.amount, true)));

  if (pending) {
    const actions = el("div", "actions");
    const ok = el("button", "ok", "✅ Ок");
    const other = el("button", "other", "✏️ Інша");
    ok.type = other.type = "button";
    ok.onclick = (e) => { e.stopPropagation(); confirmOp(tx, null); };
    other.onclick = (e) => { e.stopPropagation(); pickCategory(tx); };
    actions.append(ok, other);
    li.append(actions);
  }
  li.onclick = () => pickCategory(tx);
  return li;
}

function renderFinance() {
  const d = fin.data;
  const t = d.today;

  // сьогодні
  $("f-today").replaceChildren(document.createTextNode(money(t.spent)));
  if (t.daily !== null) $("f-today").append(el("span", "of", ` / ${money(t.daily)}`));
  barFill($("f-today-bar"), t.spent, t.daily ?? 0);
  $("f-today-bar").parentElement.hidden = t.daily === null;
  $("f-days").textContent = `днів до кінця місяця: ${t.days_left}`;
  $("f-month-line").textContent = t.limits_total
    ? `За місяць: ${money(t.month_spent)} з ${money(t.limits_total)}`
    : `За місяць: ${money(t.month_spent)} · ліміти не задано`;
  $("f-cash").textContent = d.cash === null ? "💵 Готівка: задати" : `💵 Готівка: ${money(d.cash)}`;
  $("f-balance-btn").hidden = !d.has_mono;

  // на підтвердження
  $("f-pending-box").hidden = d.pending.length === 0;
  $("f-pending").replaceChildren(...d.pending.map((tx) => opItem(tx, { pending: true })));

  // додавання
  const keys = fin.kind === "income" ? d.income_keys : d.expense_keys;
  if (fin.addCategory && !keys.includes(fin.addCategory)) fin.addCategory = "";
  chips($("f-add-cat"), [{ key: "", label: "🪄 Бот визначить" }, ...keys.map((k) => ({ key: k, label: catLabel(k) }))],
    fin.addCategory, (key) => { fin.addCategory = key; renderFinance(); });
  document.querySelectorAll("#f-kind button").forEach((b) => b.classList.toggle("on", b.dataset.kind === fin.kind));

  // місяць
  const [y, m] = d.month.key.split("-").map(Number);
  $("f-month-title").textContent = `${MONTHS[m - 1]} ${y}`;
  const now = new Date();
  $("f-next").disabled = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
  $("f-income").textContent = money(d.month.income);
  $("f-spent").textContent = money(d.month.spent);
  $("f-cats").replaceChildren(...d.month.categories.map((c) => {
    const li = el("li");
    const line = el("div", "line");
    line.append(el("span", "", catLabel(c.key)),
      el("span", "", c.limit ? `${money(c.spent)} / ${money(c.limit)} (${c.percent}%)` : money(c.spent)));
    li.append(line);
    if (c.limit) {
      const bar = el("div", "bar");
      const fill = document.createElement("i");
      barFill(fill, c.spent, c.limit);
      bar.append(fill);
      li.append(bar);
    }
    li.onclick = () => editLimit(c.key, c.limit);
    return li;
  }));

  // операції по днях або по магазинах
  document.querySelectorAll("#f-group button").forEach((b) => b.classList.toggle("on", b.dataset.group === fin.group));
  $("f-ops").replaceChildren(...(fin.group === "stores" ? storeItems(d.ops) : dayItems(d.ops)));
  $("f-ops-empty").hidden = d.ops.length > 0;
}

function dayItems(ops) {
  const items = [];
  let day = "";
  for (const tx of ops) {
    const label = new Date(tx.time * 1000).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "long" });
    if (label !== day) { items.push(el("li", "day", label)); day = label; }
    items.push(opItem(tx));
  }
  return items;
}

const placeOf = (tx) => tx.description || tx.comment || "";

// Магазини місяця: скільки разів і скільки грошей, від найбільших витрат
function storeItems(ops) {
  const stores = new Map();
  for (const tx of ops) {
    const place = placeOf(tx);
    const key = place.toLocaleLowerCase("uk-UA") || "\u0000";
    const s = stores.get(key) || { place, count: 0, total: 0, raw: 0, excluded: true, category: tx.category,
      cash: tx.source === "cash" };
    s.count += 1;
    s.raw += tx.amount;
    if (!tx.excluded) { s.total += tx.amount; s.excluded = false; }
    stores.set(key, s);
  }
  return [...stores.values()]
    .map((s) => (s.excluded ? { ...s, total: s.raw } : s)) // свої рахунки й зняття: реальна сума, блідо
    .sort((a, b) => a.excluded - b.excluded || a.total - b.total || b.count - a.count)
    .map((s) => {
      const li = el("li", "op" + (s.excluded ? " muted-op" : ""));
      li.append(el("span", "ico", s.cash ? "💵" : catIcon(s.category)));
      const body = el("div", "body");
      body.append(el("div", "place", s.place || "Без назви"));
      body.append(el("div", "cat", `${s.count} ${plural(s.count, "операція", "операції", "операцій")}`));
      li.append(body, el("span", "sum" + (s.total > 0 ? " plus" : ""), money(s.total, s.total !== 0)));
      if (s.place) li.onclick = () => storeSheet(s.place);
      return li;
    });
}

function plural(n, one, few, many) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

const shortDate = (ts) => new Date(ts * 1000).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });

// Історія одного магазину за весь час
function storeSheet(place) {
  openSheet((form) => {
    form.append(el("h2", "", `🏪 ${place}`), el("p", "muted small", "⏳ Завантажую…"));
  });
  run(async () => {
    const s = await api("GET", `/api/finance/store?place=${encodeURIComponent(place)}`);
    const form = $("fsheet-form");
    if ($("fsheet").hidden) return; // панель уже закрили
    form.replaceChildren(el("h2", "", `🏪 ${place}`));
    const totals = el("div", "totals");
    const cell = (title, value) => {
      const div = el("div");
      div.append(el("span", "muted small", title), el("b", "", value));
      return div;
    };
    totals.append(cell("Витрачено", money(s.spent)), cell("Середній чек", money(s.average)));
    form.append(totals);
    const facts = [`${s.count} ${plural(s.count, "операція", "операції", "операцій")}`];
    if (s.income) facts.push(`надходжень ${money(s.income)}`);
    if (s.first) facts.push(s.first === s.last ? shortDate(s.first) : `${shortDate(s.first)} – ${shortDate(s.last)}`);
    form.append(el("p", "muted small", facts.join(" · ")));
    if (s.categories.length) {
      form.append(el("p", "muted small", "Категорії: " + s.categories.map((c) => `${catLabel(c.key)} ×${c.count}`).join(", ")));
    }
    const list = el("ul", "ops");
    list.append(...dayItems(s.ops));
    form.append(list);
  });
}

// ---------- панель (вибір категорії, суми) ----------
function openSheet(build) {
  const form = $("fsheet-form");
  form.replaceChildren();
  form.onsubmit = null;
  build(form);
  $("fsheet").hidden = false;
  tg?.BackButton?.show();
}

function closeSheet() {
  $("fsheet").hidden = true;
  if ($("sheet").hidden) tg?.BackButton?.hide();
}
$("fsheet").addEventListener("click", (event) => { if (event.target === $("fsheet")) closeSheet(); });
tg?.BackButton?.onClick(closeSheet);

function pickCategory(tx) {
  openSheet((form) => {
    form.append(el("h2", "", `${money(tx.amount, true)} · ${tx.description || tx.comment || "Готівка"}`));
    if (tx.status === "pending") form.append(el("p", "muted small", "Чекає підтвердження. Обери категорію:"));
    const keys = tx.amount > 0 ? fin.data.income_keys : fin.data.expense_keys;
    const box = el("div", "chips");
    chips(box, keys.map((k) => ({ key: k, label: catLabel(k) })), tx.category, (key) => {
      closeSheet();
      confirmOp(tx, key);
    });
    form.append(box);
    if (placeOf(tx)) {
      const history = el("button", "ghost", "🏪 Усі операції тут");
      history.type = "button";
      history.onclick = () => storeSheet(placeOf(tx));
      form.append(history);
    }
    if (tx.source === "cash") {
      const del = el("button", "danger", "🗑 Видалити запис");
      del.type = "button";
      del.onclick = () => {
        const go = () => run(async () => {
          await api("POST", "/api/finance/ops/delete", { id: tx.id });
          haptic("warning");
          closeSheet();
          await loadFinance();
        });
        if (tg?.showConfirm) tg.showConfirm("Видалити цей запис?", (ok) => ok && go());
        else if (confirm("Видалити цей запис?")) go();
      };
      form.append(del);
    }
  });
}

function amountSheet(title, hint, initial, onSave) {
  openSheet((form) => {
    form.append(el("h2", "", title));
    if (hint) form.append(el("p", "muted small", hint));
    const input = el("input");
    input.inputMode = "decimal";
    input.placeholder = "Сума, ₴";
    input.value = initial ? String(initial / 100).replace(".", ",") : "";
    const error = el("p", "error");
    error.hidden = true;
    const save = el("button", "primary", "Зберегти");
    save.type = "submit";
    form.append(input, error, save);
    form.onsubmit = async (event) => {
      event.preventDefault();
      try {
        await onSave(input.value.trim() || "0");
        haptic("success");
        closeSheet();
        await loadFinance();
      } catch (e) {
        haptic("error");
        error.textContent = e instanceof TypeError ? "Бот офлайн" : e.message;
        error.hidden = false;
      }
    };
    setTimeout(() => input.focus(), 50);
  });
}

function editLimit(category, current) {
  if (!fin.data.limit_keys.includes(category)) return;
  amountSheet(`Ліміт: ${catLabel(category)}`, "На місяць. 0 — прибрати ліміт.", current,
    (amount) => api("PUT", "/api/finance/limits", { category, amount }));
}

// ---------- дії ----------
function confirmOp(tx, category) {
  run(async () => {
    await api("POST", "/api/finance/ops/confirm", { id: tx.id, category });
    haptic("success");
    if (category && category !== tx.category) toast(`${catLabel(category)}`);
    await loadFinance();
  });
}

$("f-cash").onclick = () => amountSheet("💵 Готівка", "Скільки зараз у гаманці. Далі бот рахує сам.", fin.data?.cash,
  (amount) => api("PUT", "/api/finance/cash", { amount }));

$("f-balance-btn").onclick = () => run(async () => {
  $("f-balance").hidden = false;
  $("f-balance").textContent = "⏳ Питаю Monobank…";
  const b = await api("GET", "/api/finance/balance");
  const lines = b.cards.map((c) => `💳 ${c.name}: ${money(c.amount)}`);
  if (b.note) lines.push(b.note);
  if (b.cash !== null) lines.push(`💵 Готівка: ${money(b.cash)}`);
  $("f-balance").textContent = lines.join(" · ");
});

document.querySelectorAll("#f-kind button").forEach((button) => {
  button.onclick = () => { fin.kind = button.dataset.kind; renderFinance(); };
});
for (const type of ["focus", "input"]) {
  $("f-amount").addEventListener(type, () => { $("f-add-extra").hidden = false; });
}
$("f-add").addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = $("f-amount").value.trim();
  if (!amount) return;
  run(async () => {
    await api("POST", "/api/finance/ops", {
      amount, kind: fin.kind, comment: $("f-comment").value, category: fin.addCategory || null,
    });
    haptic("success");
    toast(`${fin.kind === "income" ? "+" : "−"}${amount} ₴ записано`);
    $("f-amount").value = "";
    $("f-comment").value = "";
    $("f-add-extra").hidden = true;
    fin.addCategory = "";
    document.activeElement?.blur();
    await loadFinance();
  });
});

document.querySelectorAll("#f-group button").forEach((button) => {
  button.onclick = () => { fin.group = button.dataset.group; renderFinance(); };
});

$("f-prev").onclick =() => { fin.month = shiftMonth(fin.data.month.key, -1); loadFinance(); };
$("f-next").onclick = () => { fin.month = shiftMonth(fin.data.month.key, 1); loadFinance(); };

// Вкладку вантажимо, коли її відкрили, і оновлюємо при поверненні в застосунок
document.querySelector('.tabs [data-screen="finance"]').addEventListener("click", loadFinance);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && $("finance").classList.contains("active")) loadFinance();
});
