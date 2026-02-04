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

function getTotalCartItems() {
  const cart = getCart();
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const totalItems = getTotalCartItems();

  if (totalItems > 0) {
    badge.textContent = totalItems > 99 ? "99+" : totalItems;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function calculateSubtotal(cart) {
  return cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
}

function updateCartItem(itemId, stallId, quantity) {
  const cart = getCart();
  const itemIndex = cart.items.findIndex(
    (item) => item.itemId === itemId && item.stallId === stallId,
  );

  if (itemIndex !== -1) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    saveCart(cart);
    renderCart();
  }
}

function removeCartItem(itemId, stallId) {
  const cart = getCart();
  cart.items = cart.items.filter(
    (item) => !(item.itemId === itemId && item.stallId === stallId),
  );
  saveCart(cart);
  renderCart();
}

function createCartItemCard(item) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-lg p-6 shadow-sm border border-gray-200";

  const totalPrice = item.price * item.quantity;

  card.innerHTML = `
    <div class="flex gap-6">
      <!-- Product Image -->
      <div class="shrink-0">
        <img 
          src="${item.image || "/static/placeholder-food.jpg"}" 
          alt="${item.name}"
          class="w-24 h-24 object-cover rounded-md"
        />
      </div>
      
      <!-- Product Details -->
      <div class="flex-1">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="font-semibold text-lg mb-1">${item.name}</h3>
            <p class="text-sm text-gray-500 mb-1">${item.stallName}</p>
            ${item.desc ? `<p class="text-sm text-gray-600 mb-2">${item.desc}</p>` : ""}
            <p class="text-xs text-green-600 font-medium">In Stock</p>
          </div>
          <button 
            class="text-gray-400 hover:text-red-500 transition-colors"
            onclick="removeCartItem('${item.itemId}', '${item.stallId}')"
          >
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        
        <!-- Price and Quantity Row -->
        <div class="flex items-center justify-between mt-4">
          <div class="flex items-center gap-8">
            <div>
              <p class="text-xs text-gray-500 mb-1">Each</p>
              <p class="font-semibold">$${item.price.toFixed(2)}</p>
            </div>
            
            <div>
              <p class="text-xs text-gray-500 mb-1">Quantity</p>
              <div class="flex items-center gap-2 border border-gray-300 rounded-md">
                <button 
                  class="px-3 py-1 hover:bg-gray-100 transition-colors"
                  onclick="updateCartItem('${item.itemId}', '${item.stallId}', ${item.quantity - 1})"
                >
                  -
                </button>
                <span class="px-3 py-1 min-w-10 text-center border-x border-gray-300">${item.quantity}</span>
                <button 
                  class="px-3 py-1 hover:bg-gray-100 transition-colors"
                  onclick="updateCartItem('${item.itemId}', '${item.stallId}', ${item.quantity + 1})"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <p class="text-xs text-gray-500 mb-1">Total</p>
              <p class="font-bold text-lg">$${totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return card;
}

function renderCart() {
  const cart = getCart();
  const cartItemsContainer = document.getElementById("cart-items");
  const emptyCart = document.getElementById("empty-cart");
  const cartContent = document.getElementById("cart-content");
  const cartItemCount = document.getElementById("cart-item-count");

  // Update item count
  const totalItems = cart.items.length;
  cartItemCount.textContent = `${totalItems} Item${totalItems !== 1 ? "s" : ""}`;

  // Show/hide empty cart message
  if (cart.items.length === 0) {
    emptyCart.classList.remove("hidden");
    cartContent.classList.add("hidden");
    updateCartBadge();
    return;
  } else {
    emptyCart.classList.add("hidden");
    cartContent.classList.remove("hidden");
  }

  // Clear and populate cart items
  cartItemsContainer.innerHTML = "";
  cart.items.forEach((item) => {
    const card = createCartItemCard(item);
    cartItemsContainer.appendChild(card);
  });

  // Calculate totals
  const subtotal = calculateSubtotal(cart);
  //   const shippingCost = calculateShipping(subtotal);
  //   const shippingDiscount = shippingCost > 0 ? 0 : 5.00;
  const total = subtotal;

  // Update price displays
  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  //   document.getElementById('shipping-cost').textContent = `$${shippingCost.toFixed(2)}`;
  //   document.getElementById('shipping-discount').textContent = `-$${shippingDiscount.toFixed(2)}`;
  //   document.getElementById('shipping-discount-display').textContent = `-$${shippingDiscount.toFixed(2)}`;
  document.getElementById("total").textContent = `$${total.toFixed(2)}`;

  // Update cart badge
  updateCartBadge();

  // Reinitialize Lucide icons
  lucide.createIcons();
}

// Make functions globally accessible
window.updateCartItem = updateCartItem;
window.removeCartItem = removeCartItem;

// Checkout button handler
document.getElementById("checkout-btn")?.addEventListener("click", () => {
  const cart = getCart();
  if (cart.items.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  alert("Proceeding to checkout...");
  // TODO: Navigate to checkout page
});

// Promo code handler
document.getElementById("apply-promo-btn")?.addEventListener("click", () => {
  const promoInput = document.getElementById("promo-code-input");
  const promoCode = promoInput.value.trim();

  if (!promoCode) {
    alert("Please enter a promo code");
    return;
  }

  // TODO: Implement promo code validation
  alert(`Promo code "${promoCode}" applied! (Feature coming soon)`);
  promoInput.value = "";
});

// Initialize cart on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderCart);
} else {
  renderCart();
}
