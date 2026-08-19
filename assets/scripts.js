// Execute scripts when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio initialized successfully.');

  // Example interaction: Smooth console feedback for links
  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  externalLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      console.log(`Navigating to external URL: ${link.href}`);
    });
  });
});