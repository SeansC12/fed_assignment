// ---------- GET ELEMENTS ----------
const officerNameEl = document.getElementById("officer-name");
const officerInitialsEl = document.getElementById("officer-initials");

// ---------- LOAD OFFICER DATA ----------
const officerName = localStorage.getItem("neaOfficerName");
const officerId = localStorage.getItem("neaOfficerId");

if (officerName && officerId) {
  // Show full name
  officerNameEl.textContent = officerName;

  // Generate initials automatically
  const initials = officerName
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();

  officerInitialsEl.textContent = initials;
} else {
  // Not logged in → redirect to login page
  window.location.href = "../../nea_officer/login.html";
}
