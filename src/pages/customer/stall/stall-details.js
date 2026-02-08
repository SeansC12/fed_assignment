import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { updateCartBadge, initCartBadge } from "../cart-utils.js";
import { setupUserProfilePopup } from "../user-utils.js";

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

// Store current stall and menu data globally
let currentStall = null;
let currentMenuItems = [];
let activePromotions = [];
let searchQuery = "";

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
    // Calculate final price
    const discount = getItemDiscount(menuItem.id);
    const finalPrice =
      discount > 0
        ? calculateDiscountedPrice(menuItem.price, discount)
        : menuItem.price;

    // Add new item to cart
    cart.items.push({
      itemId: menuItem.id,
      stallId: currentStall.id,
      stallName: currentStall.name,
      name: menuItem.name,
      price: finalPrice,
      originalPrice: menuItem.price,
      discount: discount,
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
  const menuContainer = document.querySelector("#menu-sections");
  if (!menuContainer) return;

  const newMenuContainer = menuContainer.cloneNode(true);
  // I cloned the container using cloneNode to remove all existing event listeners
  // because I had to dynamically attach listeners to newly created menu items based on
  // the firebase and interactions like add to cart, search etc.
  // Thus, I replaced the container to remove old listeners and attach new ones (below).

  menuContainer.parentNode.replaceChild(newMenuContainer, menuContainer);

  // Attach single delegated event listener
  newMenuContainer.addEventListener("click", (e) => {
    const increaseBtn = e.target.closest(".quantity-increase");
    const decreaseBtn = e.target.closest(".quantity-decrease");
    const addBtn = e.target.closest(".food-item-card-add-button");
    const likeBtn = e.target.closest(".food-item-card-like-button");
    const card = e.target.closest(".food-item-card");

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
    } else if (likeBtn) {
      e.stopPropagation();
      likeBtn.classList.toggle("liked");
      const heartIcon = likeBtn.querySelector('[data-lucide="heart"]');
      if (heartIcon) {
        if (likeBtn.classList.contains("liked")) {
          heartIcon.classList.add("fill-red-500", "text-red-500");
        } else {
          heartIcon.classList.remove("fill-red-500", "text-red-500");
        }
        lucide.createIcons();
      }
    } else if (card && !card.classList.contains("cursor-not-allowed")) {
      const wrapper = card.querySelector("[id^='item-wrapper-']");
      if (wrapper) {
        const itemId = wrapper.id.replace("item-wrapper-", "");
        addToCart(itemId);
      }
    }
  });
}

async function fetchStallDetails(stallId) {
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

// Fetch promotions for a stall
async function fetchPromotions(stallId) {
  try {
    const promotionsQuery = query(
      collection(db, "promotions"),
      where("stallid", "==", stallId),
    );
    const promotionsSnapshot = await getDocs(promotionsQuery);
    const promotions = promotionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return promotions;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return [];
  }
}

// Check if a promotion is currently active
function isPromotionActive(promotion) {
  if (!promotion.dateStart || !promotion.dateEnd) return false;

  const now = new Date();
  const startDate = promotion.dateStart.toDate
    ? promotion.dateStart.toDate()
    : new Date(promotion.dateStart);
  const endDate = promotion.dateEnd.toDate
    ? promotion.dateEnd.toDate()
    : new Date(promotion.dateEnd);

  return now >= startDate && now <= endDate;
}

// Get active promotions and filter them
function getActivePromotions(promotions) {
  return promotions.filter(isPromotionActive);
}

// Get discount for a specific menu item
function getItemDiscount(itemId) {
  for (const promotion of activePromotions) {
    if (promotion.affectedId && promotion.affectedId.includes(itemId)) {
      console.log(promotion);
      return parseFloat(promotion.discount) || 0;
    }
  }
  return 0;
}

// Calculate discounted price
function calculateDiscountedPrice(originalPrice, discountPercent) {
  console.log("discount percentage", discountPercent);
  return originalPrice * (1 - discountPercent / 100);
}

// Fetch reviews for a stall
async function fetchReviews(stallId) {
  try {
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("stallId", "==", stallId),
      where("itemID", "==", ""),
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// Calculate rating distribution
function calculateRatingDistribution(reviews) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach((review) => {
    const rating = review.rating;
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });

  return distribution;
}

// Calculate average rating
function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

// Render star rating
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHTML = "";

  for (let i = 0; i < fullStars; i++) {
    starsHTML +=
      '<i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>';
  }

  if (hasHalfStar && fullStars < 5) {
    starsHTML +=
      '<i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>'; // For simplicity, showing full star for half star
  }

  // Fill remaining with empty stars up to 5
  const totalStars = hasHalfStar ? fullStars + 1 : fullStars;
  for (let i = totalStars; i < 5; i++) {
    starsHTML += '<i data-lucide="star" class="w-4 h-4 text-gray-300"></i>';
  }

  return starsHTML;
}

// Format date
function formatReviewDate(timestamp) {
  if (!timestamp) return "Unknown date";

  let date;
  if (timestamp.toDate) {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else {
    return "Unknown date";
  }

  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Display rating distribution
function displayRatingDistribution(distribution, totalReviews) {
  const container = document.getElementById("rating-distribution");
  if (!container) return;

  container.innerHTML = "";

  for (let star = 5; star >= 1; star--) {
    const count = distribution[star] || 0;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    const row = document.createElement("div");
    row.className = "flex items-center gap-2 text-sm";
    row.innerHTML = `
      <span class="w-3 text-right">${star}</span>
      <i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>
      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div class="h-full bg-gray-800 transition-all duration-500" style="width: ${percentage}%"></div>
      </div>
      <span class="w-8 text-right text-gray-600">${count}</span>
    `;
    container.appendChild(row);
  }
  // Initialize Lucide icons for the newly added stars
  lucide.createIcons();
}

// Display individual reviews
async function displayReviews(reviews) {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  container.innerHTML = "";

  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>No reviews yet. Be the first to review this stall!</p>
      </div>
    `;
    return;
  }

  // Sort reviews by date (newest first)
  const sortedReviews = [...reviews].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB - dateA;
  });

  // Fetch customer/vendor data for each review
  for (const review of sortedReviews) {
    let customerName = "Anonymous User";

    if (review.customerID) {
      try {
        // Try customer_list first
        let userDoc = await getDoc(doc(db, "customer_list", review.customerID));

        // If not found in customer_list, try vendor_list
        if (!userDoc.exists()) {
          userDoc = await getDoc(doc(db, "vendor_list", review.customerID));
        }

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Use name if available, otherwise use email prefix
          if (userData.name) {
            customerName = userData.name;
          } else if (userData.email) {
            // Extract name from email (part before @)
            customerName = userData.email.split("@")[0];
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    const reviewCard = document.createElement("div");
    reviewCard.className = "border-b border-gray-200 pb-6";

    const maxDescLength = 200;
    const needsExpansion =
      review.description && review.description.length > maxDescLength;
    const truncatedDesc = needsExpansion
      ? review.description.substring(0, maxDescLength) + "..."
      : review.description;

    reviewCard.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-sm">${customerName}</span>
          </div>
          <div class="flex items-center gap-0.5 mb-1">
            ${renderStars(review.rating)}
          </div>
        </div>
        <span class="text-xs text-gray-500">${formatReviewDate(review.date)}</span>
      </div>
      <div class="text-sm text-gray-700">
        <p class="review-description ${needsExpansion ? "truncated" : ""}" data-full="${review.description || ""}" data-truncated="${truncatedDesc}">
          ${truncatedDesc}
        </p>
        ${
          needsExpansion
            ? `
          <button class="show-more-btn text-blue-600 hover:underline text-xs mt-1">
            Show more
          </button>
        `
            : ""
        }
      </div>
    `;

    container.appendChild(reviewCard);
  }

  // Initialize Lucide icons for the newly added stars
  lucide.createIcons();

  // Add event listeners for "Show more" buttons
  container.querySelectorAll(".show-more-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const button = e.target;
      const descriptionElement = button.previousElementSibling;
      const fullText = descriptionElement.dataset.full;
      const truncatedText = descriptionElement.dataset.truncated;
      const isExpanded = button.textContent.trim() === "Show less";

      if (isExpanded) {
        descriptionElement.textContent = truncatedText;
        button.textContent = "Show more";
      } else {
        descriptionElement.textContent = fullText;
        button.textContent = "Show less";
      }
    });
  });
}

// Load and display reviews
async function loadReviews(stallId) {
  const reviews = await fetchReviews(stallId);

  // Calculate statistics
  const averageRating = calculateAverageRating(reviews);
  const distribution = calculateRatingDistribution(reviews);

  // Update overall rating display
  const overallRatingElement = document.getElementById("overall-rating");
  const overallStarsElement = document.getElementById("overall-stars");
  const totalReviewsElement = document.getElementById("total-reviews");

  if (overallRatingElement) {
    overallRatingElement.textContent = averageRating;
  }

  if (overallStarsElement) {
    overallStarsElement.innerHTML = renderStars(parseFloat(averageRating));
    lucide.createIcons();
  }

  if (totalReviewsElement) {
    totalReviewsElement.textContent = `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`;
  }

  // Display rating distribution
  displayRatingDistribution(distribution, reviews.length);

  // Display individual reviews
  await displayReviews(reviews);
}

// Review Modal Functions
let selectedRating = 0;

function openReviewModal() {
  const modal = document.getElementById("review-modal");
  if (modal) {
    modal.classList.remove("hidden");
    // Reset form
    selectedRating = 0;
    updateStarSelection(selectedRating);
    document.getElementById("review-text").value = "";
    document.getElementById("rating-error").classList.add("hidden");
    lucide.createIcons();
  }
}

function closeReviewModal() {
  const modal = document.getElementById("review-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function updateStarSelection(selectedRating) {
  console.log("Updating star selection to:", selectedRating);
  const starButtons = document.querySelectorAll(".star-btn");
  console.log("Found star buttons:", starButtons.length);

  starButtons.forEach((btn, index) => {
    // Find the <i> element specifically (before lucide converts it)
    const icon = btn.querySelector('[data-lucide="star"]');
    console.log(`Button ${index}: icon found:`, !!icon, icon);

    if (!icon) return;

    // Update classes on the original <i> element
    if (index < selectedRating) {
      icon.classList.remove("text-gray-300");
      icon.classList.add("fill-yellow-400", "text-yellow-400");
      console.log(`Button ${index}: highlighted`);
    } else {
      icon.classList.remove("fill-yellow-400", "text-yellow-400");
      icon.classList.add("text-gray-300");
      console.log(`Button ${index}: not highlighted`);
    }
  });

  lucide.createIcons();
}

function setupReviewModal() {
  const writeReviewBtn = document.getElementById("write-review-btn");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelBtn = document.getElementById("cancel-review");
  const reviewForm = document.getElementById("review-form");
  const starRatingSelector = document.getElementById("star-rating-selector");

  // Open modal
  if (writeReviewBtn) {
    writeReviewBtn.addEventListener("click", () => {
      // Check if user is logged in
      if (!auth.currentUser) {
        alert("Please log in to write a review");
        return;
      }
      openReviewModal();
    });
  }

  // Close modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeReviewModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeReviewModal);
  }

  // Close modal when clicking outside
  const modal = document.getElementById("review-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeReviewModal();
      }
    });
  }

  // Star rating selection using event delegation
  if (starRatingSelector) {
    starRatingSelector.addEventListener("click", (e) => {
      const starBtn = e.target.closest(".star-btn");
      if (starBtn) {
        selectedRating = parseInt(starBtn.dataset.rating);
        console.log("Selected rating:", selectedRating);
        updateStarSelection(selectedRating);
        const ratingError = document.getElementById("rating-error");
        if (ratingError) {
          ratingError.classList.add("hidden");
        }
      }
    });
  }

  // Form submission
  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validate rating
      if (selectedRating === 0) {
        document.getElementById("rating-error").classList.remove("hidden");
        return;
      }

      const reviewText = document.getElementById("review-text").value.trim();

      if (!reviewText) {
        alert("Please write a review");
        return;
      }

      // Check if user is logged in
      if (!auth.currentUser) {
        alert("Please log in to submit a review");
        return;
      }

      const submitBtn = document.getElementById("submit-review");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Submitting...";
      submitBtn.disabled = true;

      try {
        const stallId = getStallIdFromUrl();

        // Create review object
        const reviewData = {
          customerID: auth.currentUser.uid,
          stallId: stallId,
          rating: selectedRating,
          description: reviewText,
          date: Timestamp.now(),
          itemID: "", // Empty for stall review
        };

        // Add review to Firestore
        await addDoc(collection(db, "reviews"), reviewData);

        // Close modal
        closeReviewModal();

        // Show success message
        alert("Review submitted successfully!");

        // Reload reviews
        await loadReviews(stallId);
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again.");
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
}

function updateStallInfo(stall, reviewStats) {
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

    const rating = reviewStats.averageRating || 0;
    const reviewCount = reviewStats.reviewCount || 0;

    const ratingHtml =
      reviewCount > 0
        ? `
      <div class="flex items-center gap-0.5">
        <span class="font-semibold text-black">${rating.toFixed(1)}</span>
        <i
          data-lucide="star"
          class="w-4 h-4 fill-yellow-400 text-yellow-400"
        ></i>
        <span id="stall-hearts" class="text-gray-500">(${reviewCount})</span>
      </div>
    `
        : `
      <div class="flex items-center gap-0.5">
        <span class="font-semibold text-orange-500">New</span>
      </div>
    `;

    categoriesElement.innerHTML = ratingHtml + "\n        " + cuisinesHtml;
    lucide.createIcons();
  }
}

function createFoodItemCard(item) {
  const card = document.createElement("div");
  card.className = `food-item-card ${!item.stock && item.stock !== undefined ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`;

  const imageBase64 = item.image || "/static/placeholder-food.jpg";
  const name = item.name || "Unknown Item";
  const originalPrice = item.price || 0;
  const discount = getItemDiscount(item.id);
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? calculateDiscountedPrice(originalPrice, discount)
    : originalPrice;

  // Format prices
  const priceHTML = hasDiscount
    ? `<div class="flex items-center gap-2">
         <span class="text-gray-400 line-through text-sm">$${originalPrice.toFixed(2)}</span>
         <span class="text-orange-500 font-bold">$${discountedPrice.toFixed(2)}</span>
         <span class="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">${discount}% OFF</span>
       </div>`
    : `$${originalPrice.toFixed(2)}`;

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
        <p class="food-item-card-price">${priceHTML}</p>
        ${description ? `<p class="food-item-card-description">${description}</p>` : ""}
        ${!inStock ? '<span class="food-item-card-badge bg-gray-500">Out of Stock</span>' : ""}
      </div>
      <div class="food-item-card-image-wrapper" id="item-wrapper-${item.id}">
        <img src="${imageBase64}" alt="${name}" class="food-item-card-image" />
        ${addButtonHTML}
      </div>
    </div>
  `;

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

  let filteredItems = menuItems;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredItems = menuItems.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const description = (item.desc || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      return (
        name.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });
  }

  if (filteredItems.length === 0) {
    menuContainer.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">${searchQuery.trim() ? `No items found matching "${searchQuery}"` : "No menu items available at the moment."}</p>
      </div>
    `;
    return;
  }

  const groupedItems = groupMenuItemsByCategory(filteredItems);
  const categories = Object.keys(groupedItems);

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

  lucide.createIcons();

  // Update all item UIs to reflect current cart state
  filteredItems.forEach((item) => {
    updateCardQuantityUI(item.id);
  });

  // Attach quantity control event listeners ONCE after all UI updates
  attachQuantityEventListeners();
}

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
    button.addEventListener("click", (e) => {
      document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Scroll to the corresponding category section
      const targetId = button.dataset.tab;
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
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

  // Fetch ALL stall details in parallel
  const [stall, menuItems, promotions, reviews] = await Promise.all([
    fetchStallDetails(stallId),
    fetchMenuItems(stallId),
    fetchPromotions(stallId),
    fetchReviews(stallId),
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

  const averageRating = calculateAverageRating(reviews);
  const reviewStats = {
    averageRating: parseFloat(averageRating),
    reviewCount: reviews.length,
  };

  updateStallInfo(stall, reviewStats);

  // Store stall and menu data globally for cart functionality
  currentStall = stall;
  currentMenuItems = menuItems;

  // Filter and store active promotions
  activePromotions = getActivePromotions(promotions);
  console.log("Active promotions:", activePromotions);

  const complaintBtn = document.getElementById("file-complaint-btn");
  if (complaintBtn) {
    complaintBtn.addEventListener("click", () => {
      window.location.href = `../file_complaint/file_complaint.html?stallId=${stallId}`;
    });
  }

  // Display menu items
  displayMenuItems(menuItems);

  // Load and display reviews
  await loadReviews(stallId);

  // Update search placeholder and setup search functionality
  const searchInput = document.querySelector("#menu-search");
  if (searchInput) {
    searchInput.placeholder = `Search in ${stall.name}`;

    // Add search event listener
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      displayMenuItems(currentMenuItems);
    });
  }

  // Initialize cart badge
  updateCartBadge();

  // Setup review modal
  setupReviewModal();

  hideLoadingOverlay();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializePage();
    setupUserProfilePopup(auth);
    setupMobileMenu();
  });
} else {
  initializePage();
  setupUserProfilePopup(auth);
  setupMobileMenu();
}

function setupMobileMenu() {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
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

    document.addEventListener("click", (e) => {
      if (
        !userProfileButtonMobile.contains(e.target) &&
        !userProfilePopupMobile.contains(e.target)
      ) {
        userProfilePopupMobile.classList.add("hidden");
      }
    });

    const logoutButtonMobile = document.getElementById("logout-button-mobile");
    if (logoutButtonMobile) {
      logoutButtonMobile.addEventListener("click", () => {
        auth.signOut().then(() => {
          window.location.href = "../customer-login/customer-login.html";
        });
      });
    }
  }
}
