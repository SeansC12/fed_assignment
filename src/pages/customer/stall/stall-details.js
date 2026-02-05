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

import { updateCartBadge, initCartBadge } from "../cart-utils.js";

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

// Store current stall and menu data globally
let currentStall = null;
let currentMenuItems = [];

// Get stall ID from URL
function getStallIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Cart management functions
function getCart() {
  const cartData = localStorage.getItem("cart");
  if (!cartData) {
    return { items: [] };
  }
  return JSON.parse(cartData);
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(itemId) {
  // Find the item in current menu items
  const menuItem = currentMenuItems.find((item) => item.id === itemId);

  if (!menuItem) {
    console.error("Item not found:", itemId);
    return;
  }

  // Check if item is in stock
  if (menuItem.stock === false) {
    alert("This item is currently out of stock");
    return;
  }

  // Get current cart
  const cart = getCart();

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.itemId === itemId && item.stallId === currentStall.id,
  );

  if (existingItemIndex !== -1) {
    // Increment quantity if item already in cart
    cart.items[existingItemIndex].quantity += 1;
  } else {
    // Add new item to cart
    cart.items.push({
      itemId: menuItem.id,
      stallId: currentStall.id,
      stallName: currentStall.name,
      name: menuItem.name,
      price: menuItem.price,
      image: menuItem.image,
      quantity: 1,
      desc: menuItem.desc || "",
    });
  }

  // Save updated cart
  saveCart(cart);

  // Update the UI for this specific card
  updateCardQuantityUI(itemId);

  // Update cart badge
  updateCartBadge();
}

function removeFromCart(itemId) {
  const cart = getCart();

  const existingItemIndex = cart.items.findIndex(
    (item) => item.itemId === itemId && item.stallId === currentStall.id,
  );

  if (existingItemIndex !== -1) {
    if (cart.items[existingItemIndex].quantity > 1) {
      // Decrement quantity
      cart.items[existingItemIndex].quantity -= 1;
    } else {
      // Remove item from cart
      cart.items.splice(existingItemIndex, 1);
    }

    saveCart(cart);
    updateCardQuantityUI(itemId);
    updateCartBadge();
  }
}

function getItemQuantityInCart(itemId) {
  const cart = getCart();
  const item = cart.items.find(
    (item) => item.itemId === itemId && item.stallId === currentStall.id,
  );
  return item ? item.quantity : 0;
}

function updateCardQuantityUI(itemId) {
  const quantity = getItemQuantityInCart(itemId);
  const buttonWrapper = document.getElementById(`item-wrapper-${itemId}`);

  if (!buttonWrapper) return;

  // Check if we already have quantity controls
  const existingControls = buttonWrapper.querySelector(
    ".flex.items-center.gap-2.bg-orange-500",
  );
  const addButton = buttonWrapper.querySelector(".food-item-card-add-button");

  if (quantity > 0) {
    if (existingControls) {
      // Just update the quantity number
      const quantitySpan = existingControls.querySelector("span");
      if (quantitySpan) {
        quantitySpan.textContent = quantity;
      }
    } else {
      // Replace add button with quantity controls
      if (addButton) {
        addButton.outerHTML = `
          <div class="flex items-center gap-2 bg-orange-500 rounded-full px-2 py-1.5 absolute bottom-2 right-2 transition-all duration-300 ease-in-out">
            <button class="quantity-decrease text-white hover:bg-orange-600 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-transform hover:scale-110" data-item-id="${itemId}">
              <i data-lucide="minus" class="w-4 h-4"></i>
            </button>
            <span class="text-white font-semibold min-w-5 text-center">${quantity}</span>
            <button class="quantity-increase text-white hover:bg-orange-600 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-transform hover:scale-110" data-item-id="${itemId}">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
          </div>
        `;
        lucide.createIcons();
      }
    }
  } else {
    // Show regular add button
    if (existingControls) {
      existingControls.outerHTML = `
        <button class="food-item-card-add-button transition-all duration-300 ease-in-out" data-item-id="${itemId}">
          <i data-lucide="plus" class="w-5 h-5"></i>
        </button>
      `;
      lucide.createIcons();
    }
  }
}

function attachQuantityEventListeners() {
  // Use event delegation to handle dynamically created buttons
  const menuContainer = document.querySelector("#menu-sections");
  if (!menuContainer) return;

  // Remove any existing listeners by cloning and replacing the container
  const newMenuContainer = menuContainer.cloneNode(true);
  menuContainer.parentNode.replaceChild(newMenuContainer, menuContainer);

  // Attach single delegated event listener
  newMenuContainer.addEventListener("click", (e) => {
    const increaseBtn = e.target.closest(".quantity-increase");
    const decreaseBtn = e.target.closest(".quantity-decrease");
    const addBtn = e.target.closest(".food-item-card-add-button");

    if (increaseBtn) {
      e.stopPropagation();
      const itemId = increaseBtn.dataset.itemId;
      addToCart(itemId);
    } else if (decreaseBtn) {
      e.stopPropagation();
      const itemId = decreaseBtn.dataset.itemId;
      removeFromCart(itemId);
    } else if (addBtn) {
      e.stopPropagation();
      const itemId = addBtn.dataset.itemId;
      addToCart(itemId);
    }
  });
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

function updateStallInfo(stall) {
  const stallNameElement = document.querySelector("#stall-name");
  if (stallNameElement) {
    stallNameElement.textContent = stall.name || "Unknown Stall";
  }

  const stallImageElement = document.querySelector("#stall-image");
  if (stallImageElement && stall.image) {
    stallImageElement.src = stall.image;
    stallImageElement.alt = stall.name || "Stall Image";
  }

  const addressElement = document.querySelector("#stall-address");
  if (addressElement) {
    const fullAddress = `${stall.address || ""}, ${stall.hawkerCentre || ""}`;
    addressElement.textContent = fullAddress;
  }

  const categoriesElement = document.querySelector("#stall-categories");
  if (
    categoriesElement &&
    stall.cuisineTypes &&
    stall.cuisineTypes.length > 0
  ) {
    const cuisinesHtml = stall.cuisineTypes
      .map((cuisine) => `<span>• ${cuisine}</span>`)
      .join("\n        ");

    const ratingHtml =
      categoriesElement.querySelector(".flex.items-center.gap-0\\.5")
        ?.outerHTML || "";
    categoriesElement.innerHTML = ratingHtml + "\n        " + cuisinesHtml;
  }

  const heartsElement = document.querySelector("#stall-hearts");
  if (heartsElement) {
    heartsElement.textContent = `(${stall.hearts || 0})`;
  }
}

function createFoodItemCard(item) {
  const card = document.createElement("div");
  card.className = `food-item-card ${!item.stock && item.stock !== undefined ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`;

  const imageBase64 = item.image || "/static/placeholder-food.jpg";
  const name = item.name || "Unknown Item";
  const price = item.price ? `$${item.price.toFixed(2)}` : "N/A";
  const description = item.desc || "";
  const category = item.category || "";
  const inStock = item.stock !== false;
  const quantity = getItemQuantityInCart(item.id);

  const addButtonHTML =
    quantity > 0
      ? `
    <div class="flex items-center gap-2 bg-orange-500 rounded-full px-2 py-1.5 absolute bottom-2 right-2 transition-all duration-300 ease-in-out">
      <button class="quantity-decrease text-white hover:bg-orange-600 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-transform hover:scale-110" data-item-id="${item.id}">
        <i data-lucide="minus" class="w-4 h-4"></i>
      </button>
      <span class="text-white font-semibold min-w-5 text-center">${quantity}</span>
      <button class="quantity-increase text-white hover:bg-orange-600 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-transform hover:scale-110" data-item-id="${item.id}">
        <i data-lucide="plus" class="w-4 h-4"></i>
      </button>
    </div>
  `
      : `
    <button class="food-item-card-add-button transition-all duration-300 ease-in-out" ${!inStock ? "hidden" : ""} data-item-id="${item.id}">
      <i data-lucide="plus" class="w-5 h-5"></i>
    </button>
  `;

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
      <div class="food-item-card-image-wrapper" id="item-wrapper-${item.id}">
        <img src="${imageBase64}" alt="${name}" class="food-item-card-image" />
        ${addButtonHTML}
      </div>
    </div>
  `;

  card.addEventListener("click", (e) => {
    if (e.target.closest("button") || !inStock) {
      return;
    }
    addToCart(item.id);
  });

  return card;
}

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

  // Update all item UIs to reflect current cart state
  menuItems.forEach((item) => {
    updateCardQuantityUI(item.id);
  });

  // Attach quantity control event listeners ONCE after all UI updates
  attachQuantityEventListeners();
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

  // Store stall and menu data globally for cart functionality
  currentStall = stall;
  currentMenuItems = menuItems;

  // Display menu items
  displayMenuItems(menuItems);

  // Update search placeholder
  const searchInput = document.querySelector("#menu-search");
  if (searchInput) {
    searchInput.placeholder = `Search in ${stall.name}`;
  }

  // Initialize cart badge
  updateCartBadge();

  // Hide loading overlay and show content
  hideLoadingOverlay();
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}
