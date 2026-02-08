// ================= LOAD OFFICER INFO =================
document.addEventListener("DOMContentLoaded", () => {
  const officerNameEl = document.getElementById("officer-name");
  const officerInitialsEl = document.getElementById("officer-initials");

  const officerName = localStorage.getItem("neaOfficerName");
  const officerId = localStorage.getItem("neaOfficerId");

  // If not logged in, redirect
  if (!officerName || !officerId) {
    window.location.href = "../../nea_officer/login.html";
    return;
  }

  // Set full name
  if (officerNameEl) {
    officerNameEl.textContent = officerName;
  }

  // Generate initials
  if (officerInitialsEl) {
    const initials = officerName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();

    officerInitialsEl.textContent = initials;
  }
});
// ================= LOAD OFFICER INFO =================
document.addEventListener("DOMContentLoaded", () => {
  const officerNameEl = document.getElementById("officer-name");
  const officerInitialsEl = document.getElementById("officer-initials");

  const officerName = localStorage.getItem("neaOfficerName");
  const officerId = localStorage.getItem("neaOfficerId");

  // If not logged in, redirect
  if (!officerName || !officerId) {
    window.location.href = "../../nea_officer/login.html";
    return;
  }

  // Set full name
  if (officerNameEl) {
    officerNameEl.textContent = officerName;
  }

  // Generate initials
  if (officerInitialsEl) {
    const initials = officerName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();

    officerInitialsEl.textContent = initials;
  }
});
