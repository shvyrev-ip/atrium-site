// Тестовая подмена темы: ?scheme=dark или ?scheme=light.
// Нужна для снимков и проверки тёмного варианта; обычные посетители получают
// тему от системной настройки через prefers-color-scheme.
const scheme = new URLSearchParams(location.search).get('scheme');
if (scheme === 'dark' || scheme === 'light') document.documentElement.dataset.scheme = scheme;

// Переключатель темы. Без выбора работает системная настройка; как только
// человек нажал кнопку, решение запоминается и перебивает системное.
const themeBtn = document.querySelector('.theme');
if (themeBtn) {
  const sysDark = matchMedia('(prefers-color-scheme: dark)');
  const current = () => document.documentElement.dataset.scheme ||
    (sysDark.matches ? 'dark' : 'light');
  const paint = () => {
    const dark = current() === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeBtn.title = themeBtn.getAttribute('aria-label');
  };
  themeBtn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.scheme = next;
    try { localStorage.setItem('atrium-theme', next); } catch (e) {}
    paint();
  });
  sysDark.addEventListener('change', paint);
  paint();
}

// Меню «Партнёрам» и «Меню» закрываются по Esc и щелчку мимо.
// Ссылки mailto: на машине без почтовой программы адрес хотя бы окажется в буфере обмена.
const menus = [...document.querySelectorAll('details.drop, details.burger')];
document.addEventListener('click', e => menus.forEach(d => { if (d.open && !d.contains(e.target)) d.open = false; }));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  menus.forEach(d => { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
});

const toast = document.querySelector('.toast');
let hide;
document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.addEventListener('click', () => {
  const mail = a.getAttribute('href').slice(7);
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(mail).then(() => {
    toast.textContent = `Адрес ${mail} скопирован`;
    toast.classList.add('on');
    clearTimeout(hide);
    hide = setTimeout(() => toast.classList.remove('on'), 4000);
  }, () => {});
}));
