// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { setupUserProfilePopup } from "../user-utils.js";
import { updateCartBadge } from "../cart-utils.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456",
  storageBucket: "fed-assignment-f1456.firebasestorage.app",
  messagingSenderId: "646434763443",
  appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Store all hawker stalls and selected cuisines
let allHawkerStalls = [];
let selectedCuisines = [];

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // User is not logged in, redirect to login page
    window.location.href = "../customer-login/customer-login.html";
  }
});

async function fetchAndDisplayHawkerStalls() {
  try {
    const hawkerStallsCol = collection(db, "hawker-stalls");
    const hawkerStallsSnapshot = await getDocs(hawkerStallsCol);
    allHawkerStalls = hawkerStallsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    displayFilteredStalls();
  } catch (error) {
    console.error("Error fetching hawker stalls:", error);
  }
}

function displayFilteredStalls() {
  let filteredStalls = allHawkerStalls;

  // Filter by selected cuisines if any
  if (selectedCuisines.length > 0) {
    filteredStalls = allHawkerStalls.filter((stall) => {
      // Check if stall has any of the selected cuisines
      return selectedCuisines.some((cuisine) =>
        stall.cuisineTypes?.includes(cuisine),
      );
    });
  }

  const resultsElement = document.querySelector("#results_count");
  if (resultsElement) {
    resultsElement.textContent = `${filteredStalls.length} result${filteredStalls.length !== 1 ? "s" : ""}`;
  }

  const gridContainer = document.querySelector("#grid_container");

  if (gridContainer) {
    gridContainer.innerHTML = "";

    if (filteredStalls.length === 0) {
      gridContainer.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-500">
          <p class="text-lg">No hawker stalls found matching your criteria.</p>
        </div>
      `;
    } else {
      filteredStalls.forEach((stall) => {
        const card = createHawkerCard(stall);
        gridContainer.appendChild(card);
      });
    }

    lucide.createIcons();
  }
}

function createHawkerCard(stall) {
  const card = document.createElement("div");
  card.className =
    "bg-transparent rounded-2xl overflow-hidden transition-shadow cursor-pointer";

  const imageBase64 = stall.image || "";
  console.log(imageBase64.slice(0, 30));
  const name = stall.name || "Unknown Hawker";
  const rating = stall.rating || "N/A";
  const reviewCount = stall.reviewCount || stall.reviews || 0;
  const deliveryTime = stall.deliveryTime || stall.delivery_time || "N/A";

  console.log(stall.id);

  card.innerHTML = `
    <a href="/src/pages/customer/stall/stall-details.html?id=${stall.id}">
      <div class="relative">
        <img class="w-full h-36 bg-light-gray object-cover rounded-lg" src="${imageBase64}" alt="${name}" />
      </div>
      <div class="py-4">
        <div class="mb-3">
          <h3 class="text-base font-semibold">${name}</h3>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <div class="flex items-center gap-1 font-medium">
            <span>${rating}</span>
            <i data-lucide="star" class="w-4 h-4 fill-current text-yellow-500"></i>
          </div>
          <span>(${reviewCount.toLocaleString()}+)</span>
          <span>•</span>
          <span>${deliveryTime} min</span>
        </div>
      </div>
    </a>
  `;

  return card;
}

fetchAndDisplayHawkerStalls();

// Open modal
document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.getAttribute("data-modal");
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("show");
    }
  });
});

// Close modal
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.getAttribute("data-close-modal");
    const modal = document.getElementById(modalId);
    if (modal) {
      // If Reset button, select first radio option
      if (button.classList.contains("secondary")) {
        const firstRadio = modal.querySelector('input[type="radio"]');
        if (firstRadio) firstRadio.checked = true;
      }

      modal.classList.remove("show");

      if (
        button.classList.contains("primary") ||
        button.classList.contains("secondary")
      ) {
        updateCapsuleText(modalId);
      }
    }
  });
});

// Close modal on overlay click
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("show");
    }
  });
});

// Toggle filter active state
document
  .querySelectorAll(".filter-capsule:not([data-modal])")
  .forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
    });
  });

// Function to update capsule text based on selection
function updateCapsuleText(modalId) {
  const modal = document.getElementById(modalId);
  const selectedRadio = modal.querySelector('input[type="radio"]:checked');

  if (!selectedRadio) return;

  const selectedText = selectedRadio.nextElementSibling.textContent;
  const capsule = document.querySelector(`[data-modal="${modalId}"]`);
  const textSpan = capsule.querySelector(".filter-capsule-icon");

  const filterName = modal.querySelector(".modal-title").textContent;

  // Check if it's the first option which we will classify to be the default value
  const isDefault =
    selectedRadio.value ===
    modal.querySelectorAll('input[type="radio"]')[0].value;

  if (isDefault) {
    // Reset to original text and remove active class
    textSpan.innerHTML = `${filterName}<i data-lucide="chevron-down" class="w-4 h-4"></i>`;
    capsule.classList.remove("active");
  } else {
    // Show selected option and add active class
    textSpan.innerHTML = `${filterName}: ${selectedText}<i data-lucide="chevron-down" class="w-4 h-4"></i>`;
    capsule.classList.add("active");
  }

  lucide.createIcons();
}

setupUserProfilePopup(auth);

// Cuisine filter functionality
document.querySelectorAll(".cuisine-item").forEach((button) => {
  button.addEventListener("click", () => {
    const cuisine = button.getAttribute("data-cuisine");

    button.classList.toggle("active");

    if (selectedCuisines.includes(cuisine)) {
      selectedCuisines = selectedCuisines.filter((c) => c !== cuisine);
    } else {
      selectedCuisines.push(cuisine);
    }

    displayFilteredStalls();
  });
});

// Mobile menu toggle
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

if (mobileMenuButton && mobileMenu) {
  mobileMenuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    // Update icon
    const icon = mobileMenuButton.querySelector("i");
    if (icon) {
      if (mobileMenu.classList.contains("hidden")) {
        icon.setAttribute("data-lucide", "menu");
      } else {
        icon.setAttribute("data-lucide", "x");
      }
      lucide.createIcons();
    }
  });
}

// Setup mobile user profile popup
const userProfileButtonMobile = document.getElementById(
  "user-profile-button-mobile",
);
const userProfilePopupMobile = document.getElementById(
  "user-profile-popup-mobile",
);

if (userProfileButtonMobile && userProfilePopupMobile) {
  userProfileButtonMobile.addEventListener("click", () => {
    userProfilePopupMobile.classList.toggle("hidden");
  });

  // Close popup when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !userProfileButtonMobile.contains(e.target) &&
      !userProfilePopupMobile.contains(e.target)
    ) {
      userProfilePopupMobile.classList.add("hidden");
    }
  });

  // Setup logout for mobile
  const logoutButtonMobile = document.getElementById("logout-button-mobile");
  if (logoutButtonMobile) {
    logoutButtonMobile.addEventListener("click", () => {
      auth.signOut().then(() => {
        window.location.href = "../customer-login/customer-login.html";
      });
    });
  }
}

updateCartBadge();

setTimeout(() => lucide.createIcons(), 100);
