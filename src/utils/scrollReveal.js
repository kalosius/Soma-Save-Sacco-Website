export default function initScrollReveal(options = {}) {
  const { root = null, rootMargin = '0px 0px -10% 0px', threshold = 0.15 } = options;

  const elems = Array.from(document.querySelectorAll('.scroll-reveal'));
  if (!elems.length) return;

  // Assign alternating left/right animation if not already set
  elems.forEach((el, i) => {
    if (!el.dataset.animate) {
      el.dataset.animate = i % 2 === 0 ? 'left' : 'right';
    }
    // ensure initial hidden state (in case CSS not loaded yet)
    el.classList.remove('revealed');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('revealed');
      } else {
        // Remove to allow re-play when scrolling back
        el.classList.remove('revealed');
      }
    });
  }, { root, rootMargin, threshold });

  elems.forEach(el => io.observe(el));

  // Return a cleanup function
  return () => {
    elems.forEach(el => io.unobserve(el));
    io.disconnect();
  };
}
