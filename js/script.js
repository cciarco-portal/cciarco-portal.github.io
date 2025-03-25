// JavaScript code to add hover effect to team member images
document.addEventListener('DOMContentLoaded', function() {
  const teamMembers = document.querySelectorAll('.team-member img');

  teamMembers.forEach(member => {
      member.addEventListener('mouseover', function() {
          member.style.transform = 'scale(1.1)';
      });

      member.addEventListener('mouseout', function() {
          member.style.transform = 'scale(1)';
      });
  });
});

ScrollReveal().reveal('.team-member', {
  delay: 200,         // Delay before the item appears (in milliseconds)
  distance: '50px',   // Distance from the viewport to reveal the item (in pixels)
  origin: 'bottom',   // Origin of the transition ('top', 'right', 'bottom', 'left')
  duration: 1000,     // Duration of the transition (in milliseconds)
  easing: 'cubic-bezier(0.5, 0, 0, 1)', // Easing function to use
  interval: 200       // Interval between each item (in milliseconds)
});



// Smooth scrolling with offset for navbar height
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const navbarHeight = document.querySelector('header').offsetHeight; // Get the navbar height
      const targetSection = document.querySelector(this.getAttribute('href'));
      
      window.scrollTo({
          top: targetSection.offsetTop - navbarHeight, // Adjust scroll position
          behavior: 'smooth' // Add smooth scrolling behavior
      });

      // Highlight the active link
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => link.classList.remove('active'));
      this.classList.add('active');
  });
});



function checkLoginStatus() {
    // Only run login popup logic if the elements exist
    const loginPopup = document.getElementById('login-popup');
    const mainContent = document.getElementById('main-content');
    if (loginPopup && mainContent) {
        if (!sessionStorage.getItem('loggedIn')) {
            loginPopup.style.display = 'flex';
        } else {
            mainContent.style.display = 'block';
        }
    }
}

document.getElementById('close-popup') && document.getElementById('close-popup').addEventListener('click', function() {
    document.getElementById('login-popup').style.display = 'none';
});

document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
      loginForm.addEventListener("submit", function(e) {
          e.preventDefault();
          const username = document.getElementById("username").value.trim();
          const password = document.getElementById("password").value;

          const accessLevels = {
              admin_procurement: 'admin123',
              accounting_finance: 'finance123',
              service_fulfillment: 'service123',
              sales_marketing: 'sales123',
              human_capital: 'human123',
              technical_services: 'tech123',
              project_management: 'project123',
              cciarco: 'cciarco123',
              gad: 'gadmode'
          };

          if (accessLevels[username] && accessLevels[username] === password) {
              console.log("Login successful. Redirecting...");
              window.location.href = "index.html"; // Ensure the correct path
          } else {
              alert("Incorrect username or password. Please try again.");
          }
      });
  }
});


// Only run checkLoginStatus if the expected elements exist (skip on login page)
if (document.getElementById('login-popup') && document.getElementById('main-content')) {
    window.onload = checkLoginStatus;
}

// Highlight navbar links based on scroll position
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');
  const navbarHeight = document.querySelector('header').offsetHeight; // Get navbar height

  function changeActiveLink() {
      let index = sections.length;

      while (--index && window.scrollY + navbarHeight < sections[index].offsetTop) {}

      navLinks.forEach((link) => link.classList.remove('active'));
      if (index >= 0) {
          navLinks[index].classList.add('active');
      }
  }

  changeActiveLink(); // Call it once to set the correct link on page load
  window.addEventListener('scroll', changeActiveLink); // Call it on scroll
});


document.addEventListener('DOMContentLoaded', () => {
  const menuIcon = document.getElementById('menu-icon');
  const navbar = document.querySelector('.navbar'); // updated from getElementById('navbar')
  if (menuIcon && navbar) {
      menuIcon.addEventListener('click', () => {
          navbar.classList.toggle('active');
      });
  }
});

let slideIndex = [0, 0]; // Index for both carousels
const slideInterval = 2000; // 2 seconds
let slideTimers = [];

// Move slides
function moveSlide(n, carousel) {
    showSlides(slideIndex[carousel - 1] += n, carousel);
}

// Show the specific slide
function showSlides(n, carousel) {
    const slides = document.querySelectorAll(`.carousel:nth-of-type(${carousel}) .carousel-slide img`);
    
    if (n >= slides.length) slideIndex[carousel - 1] = 0;
    if (n < 0) slideIndex[carousel - 1] = slides.length - 1;

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    slides[slideIndex[carousel - 1]].style.display = "block";  
}

// Auto slide for both carousels
function startAutoSlide() {
    slideTimers = slideIndex.map((_, i) => setInterval(() => {
        moveSlide(1, i + 1);
    }, slideInterval));
}

// Stop auto slide (optional)
function stopAutoSlide() {
    slideTimers.forEach(timer => clearInterval(timer));
}

// Initialize the first slides
showSlides(0, 1);
showSlides(0, 2);
startAutoSlide();

// Toggle sidebar visibility
document.getElementById("menu-icon").addEventListener("click", function() {
    var sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("open");
});

// Add active class to the current page link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    if (window.location.href.indexOf(link.href) !== -1) {
        link.classList.add('active');
    }
});


const type = new Typed('.multiple-text', {
    strings: ['Enhance transparency','Accountability','Ethics with CCIARCO.']
});

document.querySelectorAll('.toggle-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const policyContent = button.closest('.policy').querySelector('.policy-content');
      if (policyContent.style.maxHeight) {
        policyContent.style.maxHeight = null; // Collapse
        button.innerHTML = '&#9660;';
      } else {
        policyContent.style.maxHeight = `${policyContent.scrollHeight}px`; // Expand
        button.innerHTML = '&#9650;';
      }
    });
  });
  

  const carousel = document.querySelector('.carousel');
  const images = document.querySelectorAll('.carousel-image');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  
  let currentIndex = 0;
  
  function showSlide(index) {
    const totalImages = images.length;
    if (index >= totalImages) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = totalImages - 1;
    } else {
      currentIndex = index;
    }
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
  
  // Next and Previous Button Handlers
  nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
  prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
  
  // Automatic Slide (Optional)
  setInterval(() => showSlide(currentIndex + 1), 5000);


  let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
  const slideWidth = document.querySelector('.image-slider').offsetWidth;
  document.querySelector('.slides').style.transform = `translateX(-${index * slideWidth}px)`;
}

function changeSlide(direction) {
  currentSlide += direction;
  if (currentSlide < 0) currentSlide = slides.length - 1;
  if (currentSlide >= slides.length) currentSlide = 0;
  showSlide(currentSlide);
}

showSlide(currentSlide);


