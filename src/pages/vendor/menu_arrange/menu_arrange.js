import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDocs,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const menuCol = collection(db, "vendor_menu");
const auth = getAuth(app);

let menuData = [];
let activeFilter = "All";
let activeSearch = "";
let stallId = null; 
let unsubscribe = null;

// --- PROMOTION LOGIC START ---

async function fetchPromotions(stallId) {
    try {
        const promotionsQuery = query(
            collection(db, "promotions"),
            where("stallid", "==", stallId) 
        );
        const promotionsSnapshot = await getDocs(promotionsQuery);
        return promotionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching promotions:", error);
        return [];
    }
}

function isPromotionActive(promotion) {
    if (!promotion.dateStart || !promotion.dateEnd) return false;
    const now = new Date();
    const startDate = promotion.dateStart.toDate ? promotion.dateStart.toDate() : new Date(promotion.dateStart);
    const endDate = promotion.dateEnd.toDate ? promotion.dateEnd.toDate() : new Date(promotion.dateEnd);
    return now >= startDate && now <= endDate;
}

function getActivePromotions(promotions) {
    return promotions.filter(isPromotionActive);
}

function getItemDiscount(itemId, activePromos) {
    for (const promotion of activePromos) {
        if (promotion.affectedId && promotion.affectedId.includes(itemId)) {
            return parseFloat(promotion.discount) || 0;
        }
    }
    return 0;
}

function calculateDiscountedPrice(originalPrice, discountPercent) {
    if (!discountPercent || discountPercent <= 0) return originalPrice;
    return originalPrice * (1 - discountPercent / 100);
}

// --- PROMOTION LOGIC END ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // 1. Find the stall owned by this user
            const stallsRef = collection(db, "hawker-stalls");
            const qStall = query(stallsRef, where("ownerId", "==", user.uid));
            const stallSnap = await getDocs(qStall);

            if (!stallSnap.empty) {
                stallId = stallSnap.docs[0].id;
                console.log("User logged in:", user.uid);
                console.log("Managing Stall:", stallId);
                
                // 2. Start the real-time menu listener for this specific stall
                startMenuListener();
            } else {
                console.error("No stall found for this user.");
            }
        } catch (error) {
            console.error("Error fetching stall data:", error);
        }
    } else {
        // Handle logged out state if needed
        console.log("No user logged in");
    }
});

function startMenuListener() {
    // If a listener already exists, stop it first
    if (unsubscribe) unsubscribe();
    if (!stallId) return;

    const q = query(menuCol, where("stallId", "==", stallId));
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        menuData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        renderItems();
    });
}


// Render items with Promotion Calculation (No animation)
async function renderItems() {
  const grid = document.getElementById("menu-grid");
  
  // 1. Fetch Active Promotions
  const allPromotions = await fetchPromotions(stallId);
  const activePromos = getActivePromotions(allPromotions);

  // 2. Filter Data
  const filteredData = menuData.filter((item) => {
    const matchesCat = activeFilter === "All" || item.category === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filteredData.length === 0) {
    grid.innerHTML = `
            <div class="col-span-full text-center py-20 rounded-2xl border-2 border-dashed border-gray-200">
                <i data-lucide="search-x" class="w-12 h-12 mx-auto text-gray-300 mb-2"></i>
                <p class="text-gray-500 font-medium">No items found.</p>
            </div>`;
  } else {
    // 3. Map Data to HTML with Pricing Logic
    grid.innerHTML = filteredData.map((item) => {
        const discountPercent = getItemDiscount(item.id, activePromos);
        const finalPrice = calculateDiscountedPrice(item.price, discountPercent);
        const hasPromo = discountPercent > 0;

        return `
            <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="h-52 bg-gray-100 relative border-b border-gray-100 overflow-hidden">
                    <img src="${item.image}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://placehold.co/400x300?text=Food+Image'">
                    
                    <div class="absolute top-4 right-4 flex flex-col items-end gap-1">
                        ${hasPromo ? `
                            <span class="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                                -${discountPercent}% PROMO
                            </span>
                            <span class="bg-white/95 backdrop-blur px-3 py-1 rounded-xl text-sm font-black text-gray-800 shadow-sm border border-gray-100 flex flex-col items-end leading-tight">
                                <span class="text-[10px] text-gray-400 line-through decoration-red-400 decoration-2">$${Number(item.price).toFixed(2)}</span>
                                <span class="text-red-600">$${Number(finalPrice).toFixed(2)}</span>
                            </span>
                        ` : `
                            <span class="bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-black text-gray-800 shadow-sm border border-gray-100">
                                $${Number(item.price).toFixed(2)}
                            </span>
                        `}
                    </div>
                </div>

                <div class="p-6 flex-1">
                    <span class="text-[10px] font-black tracking-widest text-orange-500 uppercase px-2 py-1 bg-orange-50 rounded">${item.category}</span>
                    <h3 class="text-xl font-bold text-gray-900 mt-2">${item.name}</h3>
                    <p class="text-gray-500 text-sm mt-2 line-clamp-2">${item.desc}</p>
                </div>

                <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full ${item.stock ? "bg-green-500" : "bg-red-400"}"></div>
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-tight">${item.stock ? "Available" : "Sold Out"}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editItem('${item.id}')" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteItem('${item.id}')" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>`;
      })
      .join("");
  }
  if (window.lucide) lucide.createIcons();
}

// DELETE FUNCTION
async function deleteItem(id) {
  const item = menuData.find((i) => i.id === id);
  if (confirm(`Delete "${item.name}" from the menu?`)) {
    try {
      await deleteDoc(doc(db, "vendor_menu", id));
    } catch (e) {
      alert("Error deleting item: " + e.message);
    }
  }
}

// FILTER & SEARCH
window.filterByCategory = (category) => {
  activeFilter = category;
  const filterMenu = document.getElementById("filterMenu");
  if (filterMenu) filterMenu.classList.add("hidden");
  renderItems();
};

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeSearch = e.target.value;
      renderItems();
    });
}

// DROPDOWN UI
const filterBtn = document.getElementById("filterBtn");
const filterMenu = document.getElementById("filterMenu");

if (filterBtn && filterMenu) {
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle("hidden");
    });
}

window.addEventListener("click", () => {
    if (filterMenu) filterMenu.classList.add("hidden");
});

window.deleteItem = deleteItem;
window.editItem = (id) => {
  window.location.href = `../menu_edit/menu_edit.html?id=${id}`;
};

if (window.lucide) lucide.createIcons();

const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = document.getElementById('menu-icon');

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.toggle('hidden');
        if (window.lucide) {
            menuIcon.setAttribute('data-lucide', isHidden ? 'menu' : 'x');
            lucide.createIcons();
        }
    });
}