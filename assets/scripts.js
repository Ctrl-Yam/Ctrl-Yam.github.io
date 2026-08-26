document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio initialized successfully.');

  const revealTargets = document.querySelectorAll('section > div, footer');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((target) => {
    target.classList.add('reveal-on-scroll');
    revealObserver.observe(target);
  });

  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  externalLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      console.log(`Navigating to external URL: ${link.href}`);
    });
  });
});