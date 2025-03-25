document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.navbar .nav-link');
  // Add "active" to the link matching the current URL
  navLinks.forEach(link => {
    if(link.href === window.location.href || link.href.endsWith(window.location.pathname)) {
      link.classList.add('active');
    }
    // Update active class on click (for non-reload situations)
    link.addEventListener('click', function() {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
