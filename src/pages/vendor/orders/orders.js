import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    doc, 
    getDocs, 
    getDoc, 
    updateDoc, 
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
const auth = getAuth(app);

let stallId = "NkfmlElwOWPU0Mb5L40n"; 
let currentStatusFilter = 'pending';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const stallsRef = collection(db, "hawker-stalls");
        const q = query(stallsRef, where("ownerId", "==", user.uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            stallId = snap.docs[0].id;
            console.log("Logged in stall:", stallId);
            displayStallName();
            startOrderListener();
        } else {
            console.error("No stall found for this user.");
        }
    } else {
        console.log("No user logged in. Defaulting to preview mode.");
    }
    displayStallName();
    startOrderListener();
});

// --- PROMOTION HELPERS ---

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


// --- EXISTING HELPERS ---

const menuCache = {}; 
const customerCache = {}; 

async function fetchItemDetails(itemId) {
    if (!itemId) return { name: "Missing ID", price: 0 };
    if (menuCache[itemId]) return menuCache[itemId];

    try { 
        const itemRef = doc(db, "vendor_menu", itemId);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
            menuCache[itemId] = itemSnap.data();
            return menuCache[itemId];
        }
    } catch (e) { console.error("Error fetching menu item:", e); }
    return { name: "Unknown Item", price: 0 };
}

async function fetchCustomerName(customerId) {
    if (!customerId) return "Guest User";
    if (customerCache[customerId]) return customerCache[customerId];

    try {
        const custRef = doc(db, "customer_list", customerId);
        const custSnap = await getDoc(custRef);
        
        if (custSnap.exists()) {
            const data = custSnap.data();
            if (data.customerName) {
                customerCache[customerId] = data.customerName;
                return data.customerName;
            }
            if (data.email) {
                const emailPrefix = data.email.split('@')[0];
                customerCache[customerId] = emailPrefix;
                return emailPrefix;
            }
        }
    } catch (e) { console.error("Error fetching customer data:", e); }
    
    return "Guest Customer"; 
}

function getTimeAgo(orderedAt) { 
    if (!orderedAt) return "Just now";
    let past = typeof orderedAt.toDate === 'function' ? orderedAt.toDate() : new Date(orderedAt);
    if (isNaN(past.getTime())) return "Just now";

    const now = new Date();
    const diffInMins = Math.floor((now - past) / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    return `${Math.floor(diffInMins / 60)}h ago`;
}

function updateCounterUI(currentCount) {
    const badge = document.getElementById("order-count-badge");
    if (badge) {
        badge.innerText = `${currentCount} PENDING`;
        badge.classList.toggle("hidden", currentCount === 0);
    }
}

// --- GLOBAL ACTIONS ---

window.filterOrders = (status) => {
    currentStatusFilter = status;
    startOrderListener(); 
};

window.completeOrder = async (id) => {
    try {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, { status: 'completed' });
    } catch (e) { console.error("Error completing order:", e); }
};

// --- NEW: REJECT ACTION ---
window.rejectOrder = async (id) => {
    const confirmed = confirm("Are you sure you want to reject this order? This cannot be undone.");
    if (!confirmed) return;

    try {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, { status: 'rejected' });
        console.log(`Order ${id} rejected.`);
    } catch (e) { 
        console.error("Error rejecting order:", e); 
        alert("Failed to reject order. Please try again.");
    }
};

async function displayStallName() {
    const stallRef = doc(db, "hawker-stalls", stallId);
    const stallSnap = await getDoc(stallRef);
    if (stallSnap.exists()) {
        const display = document.getElementById("stallDisplay");
        if(display) display.innerText = `Managing: ${stallSnap.data().name}`;
    }
}

// --- CORE LOGIC ---

const startOrderListener = () => {
    if (!stallId) return;
    const ordersRef = collection(db, "orders");
    
    onSnapshot(ordersRef, async (snapshot) => {
        let allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const myStallOrders = allOrders.filter(order => 
            order.items && order.items.some(item => item.stallId === stallId)
        );

        myStallOrders.sort((a, b) => {
            const timeA = new Date(a.orderedAt?.seconds * 1000 || 0);
            const timeB = new Date(b.orderedAt?.seconds * 1000 || 0);
            return currentStatusFilter === 'pending' ? timeA - timeB : timeB - timeA;
        });

        const pendingCount = myStallOrders.filter(o => o.status === 'pending').length;
        updateCounterUI(pendingCount);

        const statusFiltered = myStallOrders.filter(o => o.status === currentStatusFilter);
        await renderOrders(statusFiltered);
    });
};

async function renderOrders(orders) {
    const grid = document.getElementById("orders-grid");
    const isPending = currentStatusFilter === 'pending';

    // 1. Fetch Promotions BEFORE processing items
    const allPromotions = await fetchPromotions(stallId);
    const activePromos = getActivePromotions(allPromotions);
    
    // UI Button state logic
    const activeClass = 'bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-orange-100';
    const inactiveClass = 'text-gray-500 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-bold';
    const btnP = document.getElementById('btn-pending');
    const btnC = document.getElementById('btn-completed');
    if(btnP) btnP.className = isPending ? activeClass : inactiveClass;
    if(btnC) btnC.className = !isPending ? activeClass : inactiveClass;

    if (orders.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-gray-400 font-bold">No ${currentStatusFilter} orders.</div>`;
        return;
    }

    const orderHTMLPromises = orders.map(async (order) => {
        const myItems = order.items.filter(item => item.stallId === stallId);
        const timeAgo = getTimeAgo(order.orderedAt);

        // Fetch Customer Name and Item Details in parallel
        const [customerName, itemsWithDetails] = await Promise.all([
            fetchCustomerName(order.customerId),
            Promise.all(myItems.map(async (item) => {
                // Get basic details (name, original price)
                const details = await fetchItemDetails(item.itemId);
                
                // 2. Calculate Discount for this specific item
                const discountPercent = getItemDiscount(item.itemId, activePromos);
                const finalPrice = calculateDiscountedPrice(details.price, discountPercent);

                return { 
                    ...item, 
                    name: details.name, 
                    originalPrice: details.price,
                    discountPercent: discountPercent,
                    finalPrice: finalPrice
                };
            }))
        ]);

        const orderData = await getDoc(doc(db, "orders", order.id));
        const totalPrice = orderData.exists() ? orderData.data().totalPrice : 0;

        return `
        <div class="bg-white border border-gray-100 rounded-4xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div class="absolute top-0 right-0 ${isPending ? 'bg-orange-600' : 'bg-gray-400'} text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold">
                ${timeAgo}
            </div>

            <div class="flex justify-between items-center mb-6">
                <span class="text-xs font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                    Order #${order.id.slice(-4).toUpperCase()}
                </span>
            </div>

            <h3 class="text-2xl font-black text-gray-900 mb-4">${customerName}</h3>
            
            <div class="space-y-3 mb-8">
                ${itemsWithDetails.map(item => {
                    let priceDisplay = '';
                    if (item.discountPercent > 0) {
                        priceDisplay = `
                            <div class="text-right">
                                <span class="block text-xs text-gray-400 line-through">$${Number(item.originalPrice).toFixed(2)}</span>
                                <span class="text-red-500 font-black">$${Number(item.finalPrice).toFixed(2)}</span>
                            </div>
                        `;
                    } else {
                        priceDisplay = `<span class="text-gray-900 font-black">$${Number(item.originalPrice).toFixed(2)}</span>`;
                    }

                    return `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 font-medium">
                            <span class="text-orange-500 font-bold">${item.quantity}x</span> ${item.name}
                            ${item.discountPercent > 0 ? `<span class="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">-${item.discountPercent}% OFF</span>` : ''}
                        </span>
                        ${priceDisplay}
                    </div>
                    `;
                }).join('')}
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-gray-50">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Price</p>
                    <p class="text-2xl font-black text-gray-900">$${Number(totalPrice).toFixed(2)}</p>
                </div>
                
                <div class="flex gap-2">
                    ${isPending ? `
                        <button onclick="rejectOrder('${order.id}')" 
                                class="bg-red-50 hover:bg-red-100 text-red-500 p-4 rounded-2xl transition-all active:scale-95 group"
                                title="Reject Order">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>

                        <button onclick="completeOrder('${order.id}')" 
                                class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95"
                                title="Complete Order">
                            <i data-lucide="check" class="w-6 h-6"></i>
                        </button>
                    ` : `
                        <span class="text-green-500 font-bold flex items-center gap-1">
                            <i data-lucide="check-circle" class="w-5 h-5"></i> Done
                        </span>
                    `}
                </div>
            </div>
        </div>`;
    });

    const allCards = await Promise.all(orderHTMLPromises);
    grid.innerHTML = allCards.join('');
    if (window.lucide) lucide.createIcons();
}

// Function to safely refresh icons
function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        setTimeout(refreshIcons, 100);
    }
}

refreshIcons();

// --- MOBILE MENU HANDLER ---
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