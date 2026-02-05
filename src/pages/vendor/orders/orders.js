import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, getDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
let stallId = "NkfmlElwOWPU0Mb5L40n"; // Placeholder until we get real stall ID
let currentStatusFilter = 'pending';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Find the stall that belongs to this user's UID
        const stallsRef = collection(db, "hawker-stalls");
        const q = query(stallsRef, where("ownerId", "==", user.uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            stallId = snap.docs[0].id;
            console.log("Logged in stall:", stallId);
            
            // 2. Now that we have the ID, run your UI functions
            displayStallName();
            startOrderListener();
        } else {
            console.error("No stall found for this user.");
            // Optional: redirect to a setup page
        }
    } else {
        // No user? Send them to login
        //window.location.href = "../login/login.html"; //edit this once login page is ready
        console.log("No user logged in. Defaulting to preview mode.");
    }
    displayStallName();
    startOrderListener();
});
// --- HELPERS ---

const menuCache = {}; 
const customerCache = {}; // NEW: Cache to store customer names

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

// Helper to fetch Customer Name from customer_list
async function fetchCustomerName(customerId) {
    if (!customerId) return "Guest User";
    if (customerCache[customerId]) return customerCache[customerId];

    try {
        const custRef = doc(db, "customer_list", customerId);
        const custSnap = await getDoc(custRef);
        
        if (custSnap.exists()) {
            const data = custSnap.data();
            
            // 1. Check for customer_name
            if (data.customerName) {
                customerCache[customerId] = data.customerName;
                return data.customerName;
            }
            
            // 2. Fallback to Email Prefix (e.g., "john.doe" from "john.doe@gmail.com")
            if (data.email) {
                const emailPrefix = data.email.split('@')[0];
                customerCache[customerId] = emailPrefix;
                return emailPrefix;
            }
        }
    } catch (e) { 
        console.error("Error fetching customer data:", e); 
    }
    
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
    
    // UI Button state logic...
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
            fetchCustomerName(order.customerId), // FETCHING NAME VIA ID
            Promise.all(myItems.map(async (item) => {
                const details = await fetchItemDetails(item.itemId);
                return { ...item, name: details.name, price: details.price };
            }))
        ]);

        const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return `
        <div class="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
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
                ${itemsWithDetails.map(item => `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 font-medium">
                            <span class="text-orange-500 font-bold">${item.quantity}x</span> ${item.name}
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
