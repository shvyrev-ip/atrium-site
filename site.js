// Тестовая подмена темы: ?scheme=dark или ?scheme=light.
// Нужна для снимков и проверки тёмного варианта; обычные посетители получают
// тему от системной настройки через prefers-color-scheme.
const scheme = new URLSearchParams(location.search).get('scheme');
if (scheme === 'dark' || scheme === 'light') document.documentElement.dataset.scheme = scheme;

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
