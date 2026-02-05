import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc,
    doc,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURATION ---
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
let activeStallId = "NkfmlElwOWPU0Mb5L40n"; // Default Fallback

// Ensure stall start time is set
if (!localStorage.getItem("stallStartTime")) {
    localStorage.setItem("stallStartTime", new Date().toISOString());
}

// Use the stall ID from local storage
const stallId = localStorage.getItem("activeStallId") || "NkfmlElwOWPU0Mb5L40n";

// Cache for menu data to avoid redundant fetches during sorting
let cachedItemMap = null;

// Helper to convert Firebase Timestamp to JS Date safely
const parseDate = (fbDate) => {
    if (!fbDate) return new Date(0);
    return fbDate.toDate ? fbDate.toDate() : new Date(fbDate);
};

// --- MAIN INIT ---
async function initDashboard() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Authenticated User UID:", user.uid);
            // Attempt to find stall linked to this UID
            const foundId = await getStallIdByOwner(user.uid);
            if (foundId) {
                activeStallId = foundId;
                console.log("Stall ID Found:", activeStallId);
            } else {
                console.warn("No specific stall found for user. Using fallback.");
            }
        } else {
            console.warn("No user logged in. Using fallback stall ID for preview.");
        }

        // Proceed with loading data using activeStallId
        startDataLoad();
    });
}
async function getStallIdByOwner(uid) {
    try {
        const stallsRef = collection(db, "stalls");
        const q = query(stallsRef, where("ownerId", "==", uid));
        const snap = await getDocs(q);
        return !snap.empty ? snap.docs[0].id : null;
    } catch (e) {
        console.error("Error fetching stall mapping:", e);
        return null;
    }
}

async function startDataLoad() {
    try {
        if (!localStorage.getItem("stallStartTime")) {
            localStorage.setItem("stallStartTime", new Date().toISOString());
        }

        cachedItemMap = await fetchMenuData(); 
        await Promise.all([
            fetchAndRenderReviews(cachedItemMap),
            fetchAndRenderStats()
        ]);
        
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error("Dashboard Init Error:", error);
    }
}

// --- FETCH MENU (ID to Name mapping) ---
async function fetchMenuData() {
    const menuRef = collection(db, "vendor_menu");
    const q = query(menuRef, where("stallId", "==", activeStallId));
    const snap = await getDocs(q);
    let map = {};
    snap.forEach(doc => { map[doc.id] = doc.data().name; });
    return map;
}

// --- REVIEWS SECTION (With Email Lookup & Sorting) ---
async function fetchAndRenderReviews(itemMap) {
    const sortBy = document.getElementById("review-sort").value;
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("stallId", "==", activeStallId));
    const snap = await getDocs(q);

    const container = document.getElementById("reviews-container");
    container.innerHTML = ""; 

    let reviewCountYesterday = 0;
    let totalStars = 0;
    const now = new Date();
    const yesterday = new Date(now.setDate(now.getDate() - 1));
    yesterday.setHours(0,0,0,0);

    const stallItemIds = Object.keys(itemMap); //
    let filteredReviews = [];
    let customerIds = new Set();

    // 1. Filter reviews and track yesterday's count
    snap.forEach(docSnap => {
        const data = docSnap.data();
        
        // Check if this review belongs to your stall's items or is general
        const isStallItem = data.itemID && stallItemIds.includes(data.itemID);
        const isGeneralReview = !data.itemID || data.itemID === "";

        if (isStallItem || isGeneralReview) {
            filteredReviews.push({ id: docSnap.id, ...data });
            
            // --- ADD THIS LINE TO FIX THE RATING ---
            totalStars += parseFloat(data.rating || 0); 

            if (data.customerID) customerIds.add(data.customerID);

            const reviewDate = parseDate(data.date);
            if (reviewDate >= yesterday) {
                reviewCountYesterday++;
            }
        }
    });

    const avgRating = filteredReviews.length > 0 ? (totalStars / filteredReviews.length).toFixed(1) : "0.0";
    document.getElementById("avg-rating-value").innerText = avgRating;

    // 2. Fetch all emails from 'customer_list' in parallel
    const emailMap = {};
    const customerFetches = Array.from(customerIds).map(async (id) => {
        try {
            const custRef = doc(db, "customer_list", id); 
            const custSnap = await getDoc(custRef);
            if (custSnap.exists()) {
                emailMap[id] = custSnap.data().email;
            }
        } catch (e) {
            console.warn(`Could not fetch email for customer ${id}`);
        }
    });
    await Promise.all(customerFetches);

    // 3. Apply Sorting logic
    filteredReviews.sort((a, b) => {
        if (sortBy === "latest") {
            return parseDate(b.date) - parseDate(a.date);
        } else if (sortBy === "highest") {
            return (b.rating || 0) - (a.rating || 0);
        } else if (sortBy === "lowest") {
            return (a.rating || 0) - (b.rating || 0);
        }
        return 0;
    });

    // 4. Render the cards
    if (filteredReviews.length === 0) {
        container.innerHTML = `<div class="text-center py-20 text-gray-400">No reviews found.</div>`;
    } else {
        filteredReviews.forEach(data => {
            // Label logic: Show item name OR "General Stall Review"
            const itemName = data.itemID ? (itemMap[data.itemID] || "Item Review") : "General Feedback";
            const rating = parseInt(data.rating) || 5;
            const customerEmail = emailMap[data.customerID] || "anonymous@user.com";
            
            let starsHtml = "";
            for(let i=0; i<5; i++) {
                starsHtml += `<i data-lucide="star" class="w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}"></i>`;
            }

            const card = document.createElement("div");
            card.className = "bg-white p-5 rounded-2xl border border-orange-100 shadow-sm hover:border-orange-400 hover:shadow-md transition-all mb-4 cursor-default";
            
            card.innerHTML = `
                <div class="mb-3">
                    <h3 class="text-lg font-bold text-gray-900 leading-tight">
                        "${data.description || 'No comment left.'}"
                    </h3>
                </div>

                <div class="flex items-center justify-between mb-4">
                    <span class="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">
                        ${itemName}
                    </span>
                    <div class="flex gap-0.5">${starsHtml}</div>
                </div>

                <div class="flex items-center gap-3 pt-3 border-t border-gray-50">
                    <div class="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                        ${customerEmail.substring(0,2).toUpperCase()}
                    </div>
                    <div class="text-xs font-medium text-gray-500 truncate">
                        ${customerEmail}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    document.getElementById("reviews-count").innerText = reviewCountYesterday;
    if (window.lucide) lucide.createIcons();
}

// --- 3. CHARTS & KPIS ---
async function fetchAndRenderStats() {
    const ordersRef = collection(db, "orders");
    const snap = await getDocs(ordersRef);

    let totalRevenueToday = 0;
    let revenueYesterday = 0;
    let orderCountToday = 0;
    let itemSalesCount = {}; 
    let hoursFreq = new Array(24).fill(0);

    const now = new Date();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const yestStart = new Date(todayStart);
    yestStart.setDate(new Date(todayStart).getDate() - 1);
    const yestEnd = new Date(todayStart);
    yestEnd.setMilliseconds(-1);

    snap.forEach(doc => {
        const order = doc.data();
        const orderDate = parseDate(order.orderedAt);
        const price = parseFloat(order.totalPrice || 0);

        if (order.status !== "completed") return;

        // Ensure we only count items belonging to this stall
        const myItemsInOrder = (order.items || []).filter(item => item.stallId === activeStallId);
        if (myItemsInOrder.length === 0) return;

        // --- YESTERDAY'S REVENUE ---
        if (orderDate >= yestStart && orderDate <= yestEnd) {
            revenueYesterday += price;
        }

        // --- TODAY'S STATS ---
        if (orderDate >= todayStart) {
            totalRevenueToday += price;
            orderCountToday++;

            const hour = orderDate.getHours();
            if (!isNaN(hour)) hoursFreq[hour]++;

            myItemsInOrder.forEach(item => {
                const name = cachedItemMap[item.itemId] || "Unknown Item";
                itemSalesCount[name] = (itemSalesCount[name] || 0) + (parseInt(item.quantity) || 1);
            });
        }
    });

    // --- EFFICIENCY CALC ---
    const startTimeStr = localStorage.getItem("stallStartTime");
    const startTime = startTimeStr ? new Date(startTimeStr) : new Date(now.getTime() - 3600000);
    const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
    const efficiency = (orderCountToday / Math.max(hoursElapsed, 0.1)).toFixed(1);

    // --- UPDATE UI ---
    document.getElementById("total-revenue").innerText = `$${totalRevenueToday.toFixed(2)}`;
    document.getElementById("revenue-yesterday").innerText = `$${revenueYesterday.toFixed(2)}`;
    
    const effEl = document.getElementById("efficiency-stat");
    if (effEl) effEl.innerText = efficiency;

    renderPieChart(itemSalesCount);
    renderBarChart(hoursFreq);
}

// --- 4. RENDERERS ---
function renderPieChart(dataObj) {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const sorted = Object.entries(dataObj).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const labels = sorted.length > 0 ? sorted.map(x => x[0]) : ["No Sales"];
    const data = sorted.length > 0 ? sorted.map(x => x[1]) : [1];
    const colors = sorted.length > 0 ? ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#94a3b8'] : ['#e5e7eb'];

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderBarChart(hoursArray) {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    // Create labels for all 24 hours: ["12am", "1am", ... "11pm"]
    const labels = Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 || 12;
        const ampm = i < 12 ? 'am' : 'pm';
        return `${hour}${ampm}`;
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: hoursArray, // Use the full 24-hour array
                backgroundColor: '#1f2937',
                hoverBackgroundColor: '#f97316', // Turns orange on hover
                borderRadius: 4,
                barPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { precision: 0 }, // Only show whole numbers
                    grid: { color: '#f3f4f6' }
                },
                x: { 
                    grid: { display: false },
                    // Only show every 3rd label to keep it clean on mobile
                    ticks: {
                        callback: function(value, index) {
                            return index % 4 === 0 ? this.getLabelForValue(index) : '';
                        }
                    }
                }
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.raw} orders`
                    }
                }
            }
        }
    });
}

// --- 5. EVENT LISTENERS ---
document.getElementById("review-sort").addEventListener("change", () => {
    // Uses the cached map so sorting is near-instant
    if (cachedItemMap) {
        fetchAndRenderReviews(cachedItemMap);
    }
});

// Initialize on load
initDashboard();