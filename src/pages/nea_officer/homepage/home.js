document.addEventListener("DOMContentLoaded", () => {
  // 1. Get elements
  const welcomeNameEl = document.getElementById("welcome-officer-name");
  const navNameEl = document.getElementById("officer-name");
  const navInitialsEl = document.getElementById("officer-initials");

  // 2. Get data from localStorage
  const officerName = localStorage.getItem("neaOfficerName") || "Puay Kiat Chionh"; // Fallback if empty

  if (officerName) {
    // Update the Welcome Section (First name only)
    if (welcomeNameEl) {
      welcomeNameEl.textContent = officerName.split(" ")[0];
    }

    // Update the Nav Bar (Full name)
    if (navNameEl) {
      navNameEl.textContent = officerName;
    }

    // Update the Initials Circle
    if (navInitialsEl) {
      const initials = officerName
        .split(" ")
        .map((n) => n[0])
        .join("");
      navInitialsEl.textContent = initials.toUpperCase();
    }
  }
});