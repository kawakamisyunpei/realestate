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

/* ========================================
   スクロールフェードイン
   各セクションが画面内に入ったらふわっと表示
   ======================================== */
(() => {
  // 対象セクション
  const targets = document.querySelectorAll(
    '.section--white, .section--gray, .cta, .page-header, .staff__card, .strength-item, .selection__card, .support__card, .merit__card, .step, .alt-contact__item, .links__item'
  );
  if (!targets.length) return;

  // 初期状態: 非表示
  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  });

  // IntersectionObserver で監視
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();
