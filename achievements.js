// Вкладка «Ачівки». Спільні api(), el(), banner(), barFill() — з app.js і finance.js; badgeSvg() — з badges.js.

const ach = { data: null, filter: "progress" };

async function loadAchievements() {
  if (!API) return;
  try {
    ach.data = await api("GET", "/api/achievements");
    banner("");
    renderAchievements();
  } catch (error) {
    banner(error instanceof TypeError ? "Бот офлайн: ноут вимкнено або бот не запущено. Спробуй пізніше." : error.message);
  }
}

function achItem(a) {
  const li = el("li", "ach" + (a.unlocked_at ? "" : " locked"));
  const ico = el("span", "ico badge");
  if (a.badge) ico.innerHTML = badgeSvg(a.badge); else ico.textContent = a.icon;
  li.append(ico);
  const body = el("div", "body");
  body.append(el("div", "title", a.title), el("div", "desc", a.description));
  if (a.unlocked_at) {
    const when = new Date(a.unlocked_at * 1000).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
    body.append(el("div", "meta", `Отримано ${when}`));
  } else if (!a.hidden) {
    const bar = el("div", "bar");
    const fill = document.createElement("i");
    fill.style.width = `${Math.round((100 * a.progress) / a.target)}%`;
    bar.append(fill);
    body.append(bar, el("div", "meta", `${a.progress} / ${a.target}`));
  }
  li.append(body, el("span", "xp", `+${a.xp} XP`));
  return li;
}

function renderAchievements() {
  const d = ach.data;
  const into = d.xp - d.level_xp;
  const need = d.next_xp - d.level_xp;
  $("a-level").textContent = d.level;
  $("a-xp").textContent = `Рівень ${d.level} · ${d.xp} XP`;
  $("a-next").textContent = `ще ${need - into} XP до ${d.level + 1}-го рівня`;
  $("a-bar").style.width = `${Math.round((100 * into) / need)}%`;
  $("a-count").textContent = `Відкрито ачівок: ${d.unlocked} з ${d.total}`;

  document.querySelectorAll("#a-filter button").forEach((b) => b.classList.toggle("on", b.dataset.filter === ach.filter));
  const list = ach.filter === "done"
    ? d.achievements.filter((a) => a.unlocked_at).sort((a, b) => b.unlocked_at - a.unlocked_at)
    // попереду: спершу ті, що ближче до цілі; приховані в кінці
    : d.achievements.filter((a) => !a.unlocked_at)
      .sort((a, b) => a.hidden - b.hidden || b.progress / b.target - a.progress / a.target || a.target - b.target);
  $("a-list").replaceChildren(...list.map(achItem));
  $("a-empty").hidden = list.length > 0;
  $("a-empty").replaceChildren(ach.filter === "done"
    ? icon("quest", "Ще жодної ачівки. Виконай першу задачу") : icon("sparkle", "Усе відкрито!"));

  $("a-recent").replaceChildren(...d.recent.map((r) => {
    const li = el("li");
    const left = el("span", "", r.reason);
    const when = new Date(r.ts * 1000).toLocaleString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    left.append(document.createElement("br"), el("span", "when", when));
    li.append(left, el("span", "", `+${r.amount}`));
    return li;
  }));
}

document.querySelectorAll("#a-filter button").forEach((button) => {
  button.onclick = () => { ach.filter = button.dataset.filter; renderAchievements(); };
});
document.querySelector('.tabs [data-screen="achievements"]').addEventListener("click", loadAchievements);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && $("achievements").classList.contains("active")) loadAchievements();
});
