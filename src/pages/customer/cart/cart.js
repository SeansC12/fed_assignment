import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  console.log(currentUser);
});

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
  const badgeMobile = document.getElementById("cart-badge-mobile");
  const hamburgerBadge = document.getElementById("hamburger-cart-badge");

  const totalItems = getTotalCartItems();
  const displayText = totalItems > 99 ? "99+" : totalItems;

  if (badge) {
    if (totalItems > 0) {
      badge.textContent = displayText;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  if (badgeMobile) {
    if (totalItems > 0) {
      badgeMobile.textContent = displayText;
      badgeMobile.classList.remove("hidden");
    } else {
      badgeMobile.classList.add("hidden");
    }
  }

  if (hamburgerBadge) {
    if (totalItems > 0) {
      hamburgerBadge.textContent = displayText;
      hamburgerBadge.classList.remove("hidden");
    } else {
      hamburgerBadge.classList.add("hidden");
    }
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

  const hasDiscount = item.discount && item.discount > 0 && item.originalPrice;
  const displayPrice = item.price;
  const totalPrice = displayPrice * item.quantity;

  // Price display HTML - show original and discounted if applicable
  const priceHTML = hasDiscount
    ? `<div>
         <p class="text-xs text-gray-400 line-through">$${item.originalPrice.toFixed(2)}</p>
         <p class="font-semibold text-orange-500">$${displayPrice.toFixed(2)}</p>
         <span class="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">${item.discount}% OFF</span>
       </div>`
    : `<p class="font-semibold">$${displayPrice.toFixed(2)}</p>`;

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
              ${priceHTML}
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
  // document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
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

// Submit order to Firestore
async function submitOrder() {
  const cart = getCart();

  if (cart.items.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  if (!currentUser) {
    alert("Please log in to place an order.");
    window.location.href = "../customer-login/customer-login.html";
    return;
  }

  // Calculate total price
  const totalPrice = calculateSubtotal(cart);

  // Prepare items array - only include necessary fields
  const orderItems = cart.items.map((item) => ({
    itemId: item.itemId,
    stallId: item.stallId,
    quantity: item.quantity,
  }));

  // Create order object
  const order = {
    customerId: currentUser.uid,
    items: orderItems,
    orderedAt: serverTimestamp(),
    status: "pending",
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };

  try {
    // Show loading state
    const checkoutBtn = document.getElementById("checkout-btn");
    const originalText = checkoutBtn.textContent;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Processing...";

    // Add order to Firestore
    const docRef = await addDoc(collection(db, "orders"), order);

    console.log("Order created with ID: ", docRef.id);

    // Clear cart
    localStorage.removeItem("cart");

    // Show success message
    alert("Order placed successfully! Order ID: " + docRef.id);

    // Redirect to home or orders page
    window.location.href = "/src/pages/customer/home/home.html";
  } catch (error) {
    console.error("Error creating order: ", error);
    alert("Failed to place order. Please try again.");

    // Restore button state
    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "CHECKOUT";
  }
}

// Checkout button handler
document.getElementById("checkout-btn")?.addEventListener("click", submitOrder);

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
  document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    setupUserProfilePopup(auth);
    setupMobileMenu();
  });
} else {
  renderCart();
  setupUserProfilePopup(auth);
  setupMobileMenu();
  updateCartBadge();
}

// Mobile menu toggle
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
