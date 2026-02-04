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
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  
  const totalItems = getTotalCartItems();
  
  if (totalItems > 0) {
    badge.textContent = totalItems > 99 ? '99+' : totalItems;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// Initialize cart badge on page load
export function initCartBadge() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadge);
  } else {
    updateCartBadge();
  }
}

// Auto-initialize if this script is loaded
if (typeof document !== 'undefined') {
  initCartBadge();
}
