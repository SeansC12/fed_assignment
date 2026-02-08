// ===============================
// NEA DASHBOARD NAVBAR + USER JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // 1. Get DOM elements
  // -------------------------------
  const welcomeNameEl = document.getElementById("welcome-officer-name");
  const navNameEl = document.getElementById("officer-name");
  const navInitialsEl = document.getElementById("officer-initials");

  // -------------------------------
  // 2. Get officer name from localStorage
  // -------------------------------
  // Expected to be set during login
  // localStorage.setItem("neaOfficerName", "Puay Kiat Chionh");
  const officerName =
    localStorage.getItem("neaOfficerName") || "Puay Kiat Chionh";

  // -------------------------------
  // 3. Update UI if name exists
  // -------------------------------
  if (officerName) {
    // Welcome message → First name only
    if (welcomeNameEl) {
      welcomeNameEl.textContent = officerName.split(" ")[0];
    }

    // Navbar → Full name
    if (navNameEl) {
      navNameEl.textContent = officerName;
    }

    // Initials circle
    if (navInitialsEl) {
      const initials = officerName
        .trim()
        .split(/\s+/)
        .map(name => name.charAt(0))
        .join("")
        .toUpperCase();

      navInitialsEl.textContent = initials;
    }
  }
});

// -------------------------------
// 4. Mobile menu toggle
// -------------------------------
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");

  if (!mobileMenu) return;

  mobileMenu.classList.toggle("hidden");
}
