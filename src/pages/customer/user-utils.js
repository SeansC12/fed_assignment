import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * Sets up the user profile popup with logout functionality
 * Must be called after the DOM is loaded and Firebase app is initialized
 */
export function setupUserProfilePopup() {
  const userButton = document.getElementById("user-profile-button");
  const popup = document.getElementById("user-profile-popup");
  const logoutButton = document.getElementById("logout-button");

  if (userButton && popup) {
    // Toggle popup on user button click
    userButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      popup.classList.toggle("hidden");
    });

    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
      if (!popup.contains(e.target) && !userButton.contains(e.target)) {
        popup.classList.add("hidden");
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        const auth = getAuth();
        await signOut(auth);
        window.location.href = "/src/pages/index.html";
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to log out. Please try again.");
      }
    });
  }
}
