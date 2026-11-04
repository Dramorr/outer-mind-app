// Вкладка «Кошик»: список покупок. Спільні api(), el(), $, toast(), run(), haptic(), banner() — з app.js;
// openSheet()/closeSheet() — з finance.js; icon() — з icons.js.

const shop = { need: [], bought: [] };

async function loadShopping() {
  if (!API) return;
  try {
    Object.assign(shop, await api("GET", "/api/shopping"));
    banner("");
    renderShopping();
  } catch (error) {
    banner(error instanceof TypeError ? "Бот офлайн: ноут вимкнено або бот не запущено. Спробуй пізніше." : error.message);
  }
}

// Кожна дія API повертає весь список
async function shopAction(method, path, body) {
  Object.assign(shop, await api(method, path, body));
  renderShopping();
}

function shopItem(item) {
  const li = el("li", "task shop-item" + (item.bought ? " done" : ""));
  const check = el("button", "check");
  check.type = "button";
  check.setAttribute("aria-label", item.bought ? "Повернути в список" : "Куплено");
  if (item.bought) check.innerHTML = iconHtml("check");
  check.onclick = (event) => {
    event.stopPropagation();
    item.bought ? unbuy(item) : buy(item, li);
  };
  const body = el("div", "body");
  body.append(el("div", "title", item.title));
  li.append(check, body);
  li.onclick = () => editItem(item);
  return li;
}

function renderShopping() {
  $("s-need").replaceChildren(...shop.need.map(shopItem));
  $("s-bought").replaceChildren(...shop.bought.map(shopItem));
  $("s-bought-box").hidden = shop.bought.length === 0;
  $("s-empty").hidden = shop.need.length > 0;
  $("s-empty").replaceChildren(shop.bought.length
    ? icon("sparkle", "Усе куплено!")
    : icon("basket", "Кошик порожній. Впиши, що треба купити."));
  $("s-summary").replaceChildren(...(shop.need.length || shop.bought.length
    ? [metaLine("", [["basket", `Купити: ${shop.need.length}`], ["check", `куплено: ${shop.bought.length}`]])]
    : []));
}

function buy(item, li) {
  li.classList.add("leaving");
  run(async () => {
    await shopAction("POST", `/api/shopping/${item.id}/buy`);
    haptic("success");
    toast(item.title, () => run(() => shopAction("POST", `/api/shopping/${item.id}/unbuy`)), "check");
  }).finally(() => li.classList.remove("leaving"));
}

function unbuy(item) {
  run(async () => {
    await shopAction("POST", `/api/shopping/${item.id}/unbuy`);
    tg?.HapticFeedback?.selectionChanged();
  });
}

function editItem(item) {
  openSheet((form) => {
    const head = el("h2");
    head.append(icon("quill", "Продукт"));
    const input = el("input");
    input.maxLength = 100;
    input.value = item.title;
    const error = el("p", "error");
    error.hidden = true;
    const row = el("div", "row");
    const del = el("button", "danger");
    del.type = "button";
    del.append(icon("bin", "Видалити"));
    const save = el("button", "primary", "Зберегти");
    save.type = "submit";
    row.append(del, save);
    form.append(head, input, error, row);

    form.onsubmit = async (event) => {
      event.preventDefault();
      try {
        await shopAction("PATCH", `/api/shopping/${item.id}`, { title: input.value });
        closeSheet();
      } catch (e) {
        haptic("error");
        error.textContent = e instanceof TypeError ? "Бот офлайн" : e.message;
        error.hidden = false;
      }
    };
    del.onclick = () => run(async () => {
      await shopAction("DELETE", `/api/shopping/${item.id}`);
      haptic("warning");
      closeSheet();
    });
  });
}

// ---------- додавання ----------
const sText = $("s-text");
function fitText() {
  sText.style.height = "auto";
  sText.style.height = `${sText.scrollHeight + 2}px`;
  $("s-add-btn").hidden = !sText.value.trim();
}
sText.addEventListener("input", fitText);

$("s-add").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!sText.value.trim()) return;
  run(async () => {
    await shopAction("POST", "/api/shopping", { text: sText.value });
    const added = shop.added?.length || 0;
    haptic("success");
    toast(added ? `Додано: ${added}` : "Це вже є в списку", null, "basket");
    sText.value = "";
    fitText();
    sText.blur();
  });
});

$("s-clear").onclick = () => {
  const go = () => run(async () => {
    await shopAction("POST", "/api/shopping/clear");
    haptic("warning");
  });
  const question = "Прибрати все куплене зі списку?";
  if (tg?.showConfirm) tg.showConfirm(question, (ok) => ok && go());
  else if (confirm(question)) go();
};

document.querySelector('.tabs [data-screen="shopping"]').addEventListener("click", loadShopping);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && $("shopping").classList.contains("active")) loadShopping();
});
