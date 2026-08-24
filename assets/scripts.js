document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio initialized successfully.');

  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  externalLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      console.log(`Navigating to external URL: ${link.href}`);
    });
  });
});