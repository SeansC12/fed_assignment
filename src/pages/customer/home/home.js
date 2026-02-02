// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

async function fetchAndDisplayHawkerStalls() {
  try {
    const hawkerStallsCol = collection(db, "hawker-stalls");
    const hawkerStallsSnapshot = await getDocs(hawkerStallsCol);
    console.log;
    const hawkerStalls = hawkerStallsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const resultsElement = document.querySelector("#results_count");
    if (resultsElement) {
      resultsElement.textContent = `${hawkerStalls.length} results`;
    }

    const gridContainer = document.querySelector("#grid_container");

    if (gridContainer) {
      gridContainer.innerHTML = "";

      hawkerStalls.forEach((stall) => {
        const card = createHawkerCard(stall);
        gridContainer.appendChild(card);
      });

      lucide.createIcons();
    }
  } catch (error) {
    console.error("Error fetching hawker stalls:", error);
  }
}

function createHawkerCard(stall) {
  const card = document.createElement("div");
  card.className = "bg-transparent rounded-2xl overflow-hidden transition-shadow cursor-pointer";

  const imageUrl = stall.image || "";
  const name = stall.name || "Unknown Hawker";
  const rating = stall.rating || "N/A";
  const reviewCount = stall.reviewCount || stall.reviews || 0;
  const deliveryTime = stall.deliveryTime || stall.delivery_time || "N/A";

  card.addEventListener("click", () => {
    window.location.href = `/src/pages/customer/stall/stall-details.html?id=${stall.id}`;
  });

  card.innerHTML = `
    <div class="relative">
      <div class="w-full h-36 bg-light-gray object-cover rounded-lg" style="background-image: url('${imageUrl}');"></div>
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

  // Get filter name from modal title
  const filterName = modal.querySelector(".modal-title").textContent;

  // Check if it's the default/first option (usually "All" or "Recommended")
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

// Re-init lucide icons after modal interaction
setTimeout(() => lucide.createIcons(), 100);
