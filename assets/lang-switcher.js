// Language switcher: injects FR/EN flags into [data-lang-switch] containers.
// data-lang attribute on <html> or container determines current language.
(function () {
  const FR_FLAG = `<svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>`;

  const UK_FLAG = `<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>
  </svg>`;

  document.querySelectorAll('[data-lang-switch]').forEach((el) => {
    const current = el.getAttribute('data-current') || 'fr';
    const frHref = el.getAttribute('data-fr') || '#';
    const enHref = el.getAttribute('data-en') || '#';
    const variant = el.getAttribute('data-variant') === 'light' ? 'light' : 'dark';

    el.innerHTML = `
      <div class="lang-switch ${variant}">
        <a href="${frHref}" class="${current === 'fr' ? 'active' : ''}" aria-label="Français" title="Français">${FR_FLAG}</a>
        <a href="${enHref}" class="${current === 'en' ? 'active' : ''}" aria-label="English" title="English">${UK_FLAG}</a>
      </div>
    `;
  });
})();
