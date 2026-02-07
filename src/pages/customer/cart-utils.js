// Shared cart utilities that can be used across all pages

// Get cart from localStorage
export function getCart() {
  const cartData = localStorage.getItem("cart");
  if (!cartData) {
    return { items: [] };
  }
  return JSON.parse(cartData);
}

// Get total number of items in cart
export function getTotalCartItems() {
  const cart = getCart();
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}

// Update cart badge in navbar
export function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  const badgeMobile = document.getElementById("cart-badge-mobile");
  const hamburgerBadge = document.getElementById("hamburger-cart-badge");

  const totalItems = getTotalCartItems();
  const displayText = totalItems > 99 ? "99+" : totalItems;

  // Update desktop badge
  if (badge) {
    if (totalItems > 0) {
      badge.textContent = displayText;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  // Update mobile badge
  if (badgeMobile) {
    if (totalItems > 0) {
      badgeMobile.textContent = displayText;
      badgeMobile.classList.remove("hidden");
    } else {
      badgeMobile.classList.add("hidden");
    }
  }

  // Update hamburger menu badge
  if (hamburgerBadge) {
    if (totalItems > 0) {
      hamburgerBadge.textContent = displayText;
      hamburgerBadge.classList.remove("hidden");
    } else {
      hamburgerBadge.classList.add("hidden");
    }
  }
}

// Initialize cart badge on page load
export function initCartBadge() {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateCartBadge);
  } else {
    updateCartBadge();
  }
}

// Auto-initialize if this script is loaded
if (typeof document !== "undefined") {
  initCartBadge();
}
