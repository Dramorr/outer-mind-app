// Каркас Telegram Mini App. Жодних токенів і даних тут немає й не буде: сторінка публічна.
// Дані з'являться пізніше через API бота, який перевіряє Telegram.WebApp.initData на сервері.
const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg?.initData);

if (tg) {
  tg.ready();
  tg.expand();
}

if (inTelegram) {
  // Ім'я з initDataUnsafe лише для привітання; довіряти йому не можна, поки сервер не перевірив підпис.
  const name = tg.initDataUnsafe?.user?.first_name;
  if (name) document.getElementById("hello").textContent = `Привіт, ${name}!`;
} else {
  document.getElementById("outside").hidden = false;
}

const tabs = document.querySelectorAll(".tabs button");
tabs.forEach((button) => {
  button.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.toggle("on", b === button));
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.toggle("active", s.id === button.dataset.screen);
    });
    tg?.HapticFeedback?.selectionChanged();
  });
});
