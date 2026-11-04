// Вкладка «Огляд»: дайджести, підсумки й попередження всіх модулів (ті самі, що бот шле в особистий чат).
// Спільні api(), el(), banner(), $ — з app.js.

const MODULE_NAME = { tasks: "Задачі", finance: "Фінанси", achievements: "Ачівки" };

// Текст сповіщення — HTML у форматі Telegram. Переносимо лише дозволені теги й текст, без атрибутів:
// навіть якщо в тексті щось зайве, у сторінку воно потрапить як звичайний текст.
const ALLOWED = new Set(["B", "STRONG", "I", "EM", "U", "S", "CODE"]);

function tgHtml(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const copy = (node, into) => node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) into.append(child.textContent);
    else if (child.nodeType === Node.ELEMENT_NODE) {
      if (ALLOWED.has(child.tagName)) {
        const tag = document.createElement(child.tagName.toLowerCase());
        copy(child, tag);
        into.append(tag);
      } else copy(child, into);
    }
  });
  const out = document.createElement("div");
  copy(doc.body.firstChild, out);
  return out;
}

function dayLabel(ts) {
  const d = new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Сьогодні";
  if (d.toDateString() === yesterday.toDateString()) return "Учора";
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

async function loadOverview() {
  if (!API) return;
  try {
    const { items } = await api("GET", "/api/overview");
    banner("");
    const list = $("o-list");
    list.replaceChildren();
    let day = "";
    for (const item of items) {
      const label = dayLabel(item.ts);
      if (label !== day) {
        day = label;
        list.append(el("li", "day", label));
      }
      const li = el("li", `notice ${item.kind}`);
      const head = el("div", "notice-head");
      const time = new Date(item.ts * 1000).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
      head.append(el("span", "", MODULE_NAME[item.module] || "Огляд"), el("span", "when", time));
      const body = tgHtml(item.text);
      body.className = "notice-text";
      li.append(head, body);
      list.append(li);
    }
    $("o-empty").hidden = items.length > 0;
  } catch (error) {
    banner(error instanceof TypeError ? "Бот офлайн: ноут вимкнено або бот не запущено. Спробуй пізніше." : error.message);
  }
}

document.querySelector('.tabs [data-screen="overview"]').addEventListener("click", loadOverview);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && $("overview").classList.contains("active")) loadOverview();
});
