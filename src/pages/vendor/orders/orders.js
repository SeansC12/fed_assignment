import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let stallId = localStorage.getItem("activeStallId") || "NkfmlElwOWPU0Mb5L40n";
let currentStatusFilter = 'pending';

// --- HELPERS ---

const menuCache = {}; // Cache to avoid redundant database reads

async function fetchItemDetails(itemId) {
    if (!itemId) return { name: "Missing ID", price: 0 }; // Handle missing ID gracefully
    if (menuCache[itemId]) return menuCache[itemId]; // Return cached data if available

    try { 
        const itemRef = doc(db, "vendor_menu", itemId);
        const itemSnap = await getDoc(itemRef); // Await the promise
        if (itemSnap.exists()) { // Check if document exists
            menuCache[itemId] = itemSnap.data(); // Cache the data
            return menuCache[itemId]; // Return the fetched data
        }
    } catch (e) { console.error("Error fetching menu item:", e); } // Log any errors
    return { name: "Unknown Item", price: 0 }; // Fallback for missing items
}

function getTimeAgo(orderedAt) { 
    if (!orderedAt) return "Just now"; // Handle missing date gracefully

    let past;
    
    // Check if it's a Firestore Timestamp (has a toDate method)
    if (typeof orderedAt.toDate === 'function') {
        past = orderedAt.toDate();
    } else {
        // Otherwise, try to parse it as a standard date/string
        past = new Date(orderedAt);
    }

    // Check if the date is actually valid
    if (isNaN(past.getTime())) return "Just now";

    const now = new Date(); // Current time
    const diffInMs = now - past; // Difference in milliseconds
    const diffInMins = Math.floor(diffInMs / 60000); // Convert to minutes

    if (diffInMins < 1) return "Just now"; // Less than a minute
    if (diffInMins < 60) return `${diffInMins}m ago`; // Less than an hour
    
    const hours = Math.floor(diffInMins / 60); // Convert to hours
    return `${hours}h ago`; // Return hours ago
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

async function displayStallName() {
    const stallRef = doc(db, "hawker-stalls", stallId);
    const stallSnap = await getDoc(stallRef);
    if (stallSnap.exists()) {
        document.getElementById("stallDisplay").innerText = `Managing: ${stallSnap.data().name}`;
    }
}

// --- CORE LOGIC ---

const startOrderListener = () => {
    const ordersRef = collection(db, "orders");
    
    onSnapshot(ordersRef, async (snapshot) => {
        let allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 1. Filter for THIS stall
        const myStallOrders = allOrders.filter(order => 
            order.items && order.items.some(item => item.stallId === stallId)
        );

        // 2. Sort: Oldest first for Pending (urgency), Newest first for Completed
        myStallOrders.sort((a, b) => {
            const timeA = new Date(a.orderedAt || 0);
            const timeB = new Date(b.orderedAt || 0);
            return currentStatusFilter === 'pending' ? timeA - timeB : timeB - timeA;
        });

        // 3. Update Badge
        const pendingCount = myStallOrders.filter(o => o.status === 'pending').length;
        updateCounterUI(pendingCount);

        // 4. Render current view
        const statusFiltered = myStallOrders.filter(o => o.status === currentStatusFilter);
        await renderOrders(statusFiltered);
    });
};

async function renderOrders(orders) {
    const grid = document.getElementById("orders-grid");
    
    const isPending = currentStatusFilter === 'pending';
    const activeClass = 'bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-orange-100';
    const inactiveClass = 'text-gray-500 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-bold';
    
    document.getElementById('btn-pending').className = isPending ? activeClass : inactiveClass;
    document.getElementById('btn-completed').className = !isPending ? activeClass : inactiveClass;

    if (orders.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                <i data-lucide="clock" class="w-12 h-12 mx-auto text-gray-200 mb-4"></i>
                <p class="text-gray-400 font-bold text-lg">No ${currentStatusFilter} orders found.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const orderHTMLPromises = orders.map(async (order) => {
        const myItems = order.items.filter(item => item.stallId === stallId);
        const timeAgo = getTimeAgo(order.orderedAt);

        const itemsWithDetails = await Promise.all(myItems.map(async (item) => {
            const details = await fetchItemDetails(item.itemId);
            return { ...item, name: details.name, price: details.price };
        }));

        const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return `
        <div class="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div class="absolute top-0 right-0 ${isPending ? 'bg-orange-600' : 'bg-gray-400'} text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold">
                ${timeAgo}
            </div>

            <div class="flex justify-between items-center mb-6">
                <span class="text-xs font-black text-orange-primary bg-orange-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                    Order #${order.id.slice(-4).toUpperCase()}
                </span>
            </div>

            <h3 class="text-2xl font-black text-gray-900 mb-4">${order.customerName || "Customer"}</h3>
            
            <div class="space-y-3 mb-8">
                ${itemsWithDetails.map(item => `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 font-medium">
                            <span class="text-orange-primary font-bold">${item.quantity}x</span> ${item.name}
                        </span>
                        <span class="text-gray-900 font-black">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-gray-50">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Price</p>
                    <p class="text-2xl font-black text-gray-900">$${subtotal.toFixed(2)}</p>
                </div>
                ${isPending ? `
                    <button onclick="completeOrder('${order.id}')" class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95">
                        <i data-lucide="check" class="w-6 h-6"></i>
                    </button>
                ` : `
                    <span class="text-green-500 font-bold flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-5 h-5"></i> Done
                    </span>
                `}
            </div>
        </div>`;
    });

    const allCards = await Promise.all(orderHTMLPromises);
    grid.innerHTML = allCards.join('');
    if (window.lucide) lucide.createIcons();
}

// --- INITIALIZATION ---
displayStallName();
startOrderListener();