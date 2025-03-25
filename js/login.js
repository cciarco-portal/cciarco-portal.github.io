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
        console.log("Login successful. Redirecting to home.html...");
        window.location.href = "html/home.html";
      } else {
        console.log("Login failed. Incorrect username or password.");
        alert("Incorrect username or password. Please try again.");
      }
    });
  }
});
