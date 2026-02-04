import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
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

// Get stall ID from URL
function getStallIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Fetch stall details
async function fetchStallDetails(stallId) {
  console.log(stallId);
  try {
    const stallDoc = await getDoc(doc(db, "hawker-stalls", stallId));
    if (stallDoc.exists()) {
      return { id: stallDoc.id, ...stallDoc.data() };
    } else {
      console.error("Stall not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching stall details:", error);
    return null;
  }
}

// Fetch menu items for a stall
async function fetchMenuItems(stallId) {
  try {
    const menuQuery = query(
      collection(db, "vendor_menu"),
      where("stallId", "==", stallId),
    );
    const menuSnapshot = await getDocs(menuQuery);
    const menuItems = menuSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return menuItems;
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
}

// Update stall information in the page
function updateStallInfo(stall) {
  // Update stall name
  const stallNameElement = document.querySelector("#stall-name");
  if (stallNameElement) {
    stallNameElement.textContent = stall.name || "Unknown Stall";
  }

  // Update stall image
  const stallImageElement = document.querySelector("#stall-image");
  if (stallImageElement && stall.image) {
    stallImageElement.src = stall.image;
    stallImageElement.alt = stall.name || "Stall Image";
  }

  // Update address
  const addressElement = document.querySelector("#stall-address");
  if (addressElement) {
    const fullAddress = `${stall.address || ""}, ${stall.hawkerCentre || ""}`;
    addressElement.textContent = fullAddress;
  }

  // Update cuisine types
  const categoriesElement = document.querySelector("#stall-categories");
  if (
    categoriesElement &&
    stall.cuisineTypes &&
    stall.cuisineTypes.length > 0
  ) {
    const cuisinesHtml = stall.cuisineTypes
      .map((cuisine) => `<span>• ${cuisine}</span>`)
      .join("\n        ");

    // Keep the rating and add cuisines
    const ratingHtml =
      categoriesElement.querySelector(".flex.items-center.gap-0\\.5")
        ?.outerHTML || "";
    categoriesElement.innerHTML = ratingHtml + "\n        " + cuisinesHtml;
  }

  // Update hearts (likes)
  const heartsElement = document.querySelector("#stall-hearts");
  if (heartsElement) {
    heartsElement.textContent = `(${stall.hearts || 0})`;
  }
}

// Create a food item card
function createFoodItemCard(item) {
  const card = document.createElement("div");
  card.className = "food-item-card";

  const imageBase64 = item.image || "/static/placeholder-food.jpg";
  const name = item.name || "Unknown Item";
  const price = item.price ? `$${item.price.toFixed(2)}` : "N/A";
  const description = item.desc || "";
  const category = item.category || "";
  const inStock = item.stock !== false; // Default to true if not specified

  card.innerHTML = `
    <div class="food-item-card-inner">
      <div class="food-item-card-content">
        <div class="food-item-card-header">
          <h4 class="food-item-card-title">${name}</h4>
          <button class="food-item-card-like-button" data-item-id="${item.id}">
            <i data-lucide="heart" class="w-5 h-5"></i>
          </button>
        </div>
        <p class="food-item-card-price">${price}</p>
        ${description ? `<p class="food-item-card-description">${description}</p>` : ""}
        ${!inStock ? '<span class="food-item-card-badge bg-gray-500">Out of Stock</span>' : ""}
      </div>
      <div class="food-item-card-image-wrapper">
        <img src="${imageBase64}" alt="${name}" class="food-item-card-image" />
        <button class="food-item-card-add-button" ${!inStock ? "disabled" : ""} data-item-id="${item.id}">
          <i data-lucide="plus" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
  `;

  return card;
}

// Group menu items by category
function groupMenuItemsByCategory(menuItems) {
  const grouped = {};
  menuItems.forEach((item) => {
    const category = item.category || "Other";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  return grouped;
}

// Display menu items
function displayMenuItems(menuItems) {
  const menuContainer = document.querySelector("#menu-sections");
  if (!menuContainer) return;

  menuContainer.innerHTML = "";

  if (menuItems.length === 0) {
    menuContainer.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">No menu items available at the moment.</p>
      </div>
    `;
    return;
  }

  const groupedItems = groupMenuItemsByCategory(menuItems);
  const categories = Object.keys(groupedItems);

  // Update category tabs
  updateCategoryTabs(categories);

  // Create sections for each category
  categories.forEach((category, index) => {
    const section = document.createElement("div");
    section.id = `category-${category.toLowerCase().replace(/\s+/g, "-")}`;
    section.className = `tab-content ${index > 0 ? "mt-8" : ""}`;

    const categoryTitle = document.createElement("h3");
    categoryTitle.className = "text-xl font-bold mb-2";
    categoryTitle.textContent = category;

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6";

    groupedItems[category].forEach((item) => {
      const card = createFoodItemCard(item);
      grid.appendChild(card);
    });

    section.appendChild(categoryTitle);
    section.appendChild(grid);
    menuContainer.appendChild(section);
  });

  // Reinitialize Lucide icons
  lucide.createIcons();

  // Add event listeners for like buttons
  document.querySelectorAll(".food-item-card-like-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      button.classList.toggle("liked");
    });
  });
}

// Update category tabs
function updateCategoryTabs(categories) {
  const tabsContainer = document.querySelector("#category-tabs");
  if (!tabsContainer) return;

  tabsContainer.innerHTML = "";

  categories.forEach((category, index) => {
    const button = document.createElement("button");
    button.className = `tab-button ${index === 0 ? "active" : ""}`;
    button.textContent = category;
    button.dataset.tab = `category-${category.toLowerCase().replace(/\s+/g, "-")}`;
    tabsContainer.appendChild(button);
  });

  // Add scroll buttons
  const scrollButtonsDiv = document.createElement("div");
  scrollButtonsDiv.className = "grow flex items-center justify-end";
  scrollButtonsDiv.innerHTML = `
    <button class="scroll-button">
      <i data-lucide="chevron-left" class="w-5 h-5"></i>
    </button>
    <button class="scroll-button">
      <i data-lucide="chevron-right" class="w-5 h-5"></i>
    </button>
  `;
  tabsContainer.appendChild(scrollButtonsDiv);

  lucide.createIcons();

  // Add tab switching functionality
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

// Hide loading overlay and show main content
function hideLoadingOverlay() {
  const loadingOverlay = document.querySelector("#loading-overlay");
  const mainContent = document.querySelector("#main-content");

  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
  if (mainContent) {
    mainContent.classList.remove("hidden");
  }
}

// Initialize the page
async function initializePage() {
  const stallId = getStallIdFromUrl();

  if (!stallId) {
    console.error("No stall ID provided in URL");
    document.body.innerHTML = `
      <div class="flex items-center justify-center h-screen">
        <div class="text-center">
          <h1 class="text-2xl font-bold mb-4">Stall Not Found</h1>
          <p class="text-gray-600 mb-6">The stall you're looking for doesn't exist.</p>
          <a href="/src/pages/customer/home/home.html" class="button" data-variant="solid">Go Back Home</a>
        </div>
      </div>
    `;
    return;
  }

  // Fetch stall details and menu items in parallel
  const [stall, menuItems] = await Promise.all([
    fetchStallDetails(stallId),
    fetchMenuItems(stallId),
  ]);

  if (!stall) {
    console.error("Stall not found");
    document.body.innerHTML = `
      <div class="flex items-center justify-center h-screen">
        <div class="text-center">
          <h1 class="text-2xl font-bold mb-4">Stall Not Found</h1>
          <p class="text-gray-600 mb-6">The stall you're looking for doesn't exist.</p>
          <a href="/src/pages/customer/home/home.html" class="button" data-variant="solid">Go Back Home</a>
        </div>
      </div>
    `;
    return;
  }

  // Update page with stall information
  updateStallInfo(stall);

  // Display menu items
  displayMenuItems(menuItems);

  // Update search placeholder
  const searchInput = document.querySelector("#menu-search");
  if (searchInput) {
    searchInput.placeholder = `Search in ${stall.name}`;
  }

  // Hide loading overlay and show content
  hideLoadingOverlay();
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}
