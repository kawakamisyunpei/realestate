/* ========================================
   Deen不動産 - main.js
   ヘッダーのスクロール出現制御
   ======================================== */
(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  const threshold = 40;
  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > threshold);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
})();
