import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadOrders(user.uid);
  } else {
    window.location.href =
      "/src/pages/customer/customer-login/customer-login.html";
  }
});

async function loadOrders(userId) {
  const loadingEl = document.getElementById("loading");
  const emptyStateEl = document.getElementById("empty-state");
  const ordersContainer = document.getElementById("orders-container");

  try {
    // Query orders for this user
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("customerId", "==", userId));

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort orders by date in memory (newest first)
    orders.sort((a, b) => {
      const dateA = a.orderedAt?.toDate() || new Date(0);
      const dateB = b.orderedAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

    // Hide loading
    loadingEl.classList.add("hidden");

    if (orders.length === 0) {
      emptyStateEl.classList.remove("hidden");
      return;
    }

    // Sort orders: non-completed first
    orders.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return 0;
    });

    // Display orders
    ordersContainer.classList.remove("hidden");
    ordersContainer.innerHTML = "";

    for (const order of orders) {
      const orderCard = await createOrderCard(order);
      ordersContainer.appendChild(orderCard);
    }

    // Re-initialize Lucide icons
    lucide.createIcons();
  } catch (error) {
    console.error("Error loading orders:", error);
    loadingEl.classList.add("hidden");
    ordersContainer.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-500">Error loading orders. Please try again later.</p>
      </div>
    `;
    ordersContainer.classList.remove("hidden");
  }
}

async function createOrderCard(order) {
  const card = document.createElement("div");
  card.className =
    "bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow";

  // Format date
  const orderDate = order.orderedAt.toDate();
  const formattedDate = orderDate.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Get status color and label
  const statusConfig = getStatusConfig(order.status);

  // Create card header
  const header = document.createElement("div");
  header.className = "p-4 cursor-pointer hover:bg-gray-50 transition-colors";
  header.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}">
            ${statusConfig.icon} ${statusConfig.label}
          </span>
          <span class="text-sm text-gray-500">${formattedDate}</span>
        </div>
        <p class="text-sm text-gray-600">Order ID: ${order.id.substring(0, 8).toUpperCase()}</p>
        <p class="font-semibold text-lg mt-1">$${order.totalPrice.toFixed(2)}</p>
        <p class="text-sm text-gray-500">${order.items.length} item${order.items.length > 1 ? "s" : ""}</p>
      </div>
      <div class="flex items-center">
        <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform" id="chevron-${order.id}"></i>
      </div>
    </div>
  `;

  // Create expandable content
  const content = document.createElement("div");
  content.className = "hidden border-t border-gray-200";
  content.id = `content-${order.id}`;

  // Load items
  const itemsHTML = await loadOrderItems(order.items);
  content.innerHTML = `
    <div class="p-4 bg-gray-50">
      <h3 class="font-semibold text-sm mb-3">Order Items:</h3>
      <div class="space-y-3">
        ${itemsHTML}
      </div>
    </div>
  `;

  // Add click handler for expand/collapse
  header.addEventListener("click", () => {
    const isHidden = content.classList.contains("hidden");
    const chevron = document.getElementById(`chevron-${order.id}`);

    if (isHidden) {
      content.classList.remove("hidden");
      chevron.style.transform = "rotate(180deg)";
    } else {
      content.classList.add("hidden");
      chevron.style.transform = "rotate(0deg)";
    }

    // Re-initialize icons after showing content
    if (isHidden) {
      lucide.createIcons();
    }
  });

  card.appendChild(header);
  card.appendChild(content);

  return card;
}

async function loadOrderItems(items) {
  const itemPromises = items.map(async (item) => {
    try {
      // Get item details from vendor_menu collection
      const itemDoc = await getDoc(doc(db, "vendor_menu", item.itemId));

      if (!itemDoc.exists()) {
        return `
          <div class="flex gap-3 p-3 bg-white rounded-lg">
            <div class="flex-1">
              <p class="font-medium text-sm">Item not found</p>
              <p class="text-xs text-gray-500">Quantity: ${item.quantity}</p>
            </div>
          </div>
        `;
      }

      const itemData = itemDoc.data();
      const subtotal = itemData.price * item.quantity;

      return `
        <div class="flex gap-3 p-3 bg-white rounded-lg">
          <div class="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
            ${itemData.image ? `<img src="${itemData.image}" alt="${itemData.name}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center"><i data-lucide="image" class="w-6 h-6 text-gray-400"></i></div>`}
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-sm truncate">${itemData.name}</h4>
            <p class="text-xs text-gray-500 mt-0.5">${itemData.category}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-600">Qty: ${item.quantity}</span>
              <span class="font-semibold text-sm">$${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error loading item:", error);
      return `
        <div class="flex gap-3 p-3 bg-white rounded-lg">
          <div class="flex-1">
            <p class="font-medium text-sm text-red-500">Error loading item</p>
          </div>
        </div>
      `;
    }
  });

  const itemsHTML = await Promise.all(itemPromises);
  return itemsHTML.join("");
}

function getStatusConfig(status) {
  const configs = {
    "in progress": {
      label: "In Progress",
      className: "bg-yellow-100 text-yellow-800",
      icon: '<i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>',
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800",
      icon: '<i data-lucide="check-circle" class="w-3 h-3 inline mr-1"></i>',
    },
    pending: {
      label: "Pending",
      className: "bg-orange-100 text-orange-800",
      icon: '<i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>',
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800",
      icon: '<i data-lucide="x-circle" class="w-3 h-3 inline mr-1"></i>',
    },
  };

  return configs[status] || configs["pending"];
}

setupUserProfilePopup(auth);
updateCartBadge();
setupMobileMenu();

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
