import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const stallCache = {};

// --- ICON HELPER ---
function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// --- ACTIONS ---
window.deletePromo = async (promoId) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
        await deleteDoc(doc(db, "promotions", promoId));
        loadPromotions(); 
    } catch (e) {
        console.error("Delete failed:", e);
    }
};

// --- DATA HELPERS ---
async function getStallName(stallId) {
    if (!stallId) return "General Promo";
    if (stallCache[stallId]) return stallCache[stallId];
    try {
        const stallSnap = await getDoc(doc(db, "hawker-stalls", stallId));
        if (stallSnap.exists()) {
            stallCache[stallId] = stallSnap.data().name;
            return stallCache[stallId];
        }
    } catch (e) { console.error(e); }
    return "Unknown Stall";
}

function formatDate(timestamp) {
    if (!timestamp) return "No date";
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// --- CORE LOGIC ---
async function loadPromotions() {
    const listContainer = document.getElementById("promotions-list");
    
    try {
        const querySnapshot = await getDocs(collection(db, "promotions"));
        
        if (querySnapshot.empty) {
            listContainer.innerHTML = `
                <div class="bg-white text-center py-20 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <i data-lucide="ticket-percent" class="w-12 h-12 mx-auto text-gray-200 mb-4"></i>
                    <p class="text-gray-400 font-bold text-lg">No active promotions found.</p>
                </div>`;
            refreshIcons();
            return;
        }

        const promoCards = await Promise.all(querySnapshot.docs.map(async (promoDoc) => {
            const data = promoDoc.data();
            
            // Fix 1: Ensure stallId case matches your Firestore field
            const stallName = await getStallName(data.stallid || data.stallId);
            
            const startDateStr = formatDate(data.dateStart);
            const endDateStr = formatDate(data.dateEnd);

            // Fix 2: Use the 'affected' field for the badge text
            const displayType = data.affected || "All Items";

            // Fix 3: Map the styles based on the 'affected' field value
            const typeStyles = {
                mains: "bg-blue-50 text-blue-600 border-blue-100",
                sides: "bg-purple-50 text-purple-600 border-purple-100",
                drinks: "bg-teal-50 text-teal-600 border-teal-100",
                all: "bg-orange-50 text-orange-600 border-orange-100"
            };
            
            const styleKey = displayType.toLowerCase().replace(/\s/g, ''); // removes spaces for matching
            const badgeClass = typeStyles[styleKey] || "bg-gray-50 text-gray-500 border-gray-100";

            return `
            <div class="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border ${badgeClass}">
                            ${displayType}
                        </span>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${stallName}</span>
                    </div>
                    
                    <h3 class="text-2xl font-black text-gray-900 mb-1">${data.name}</h3>
                    <p class="text-gray-500 mb-4 leading-relaxed">${data.description}</p>
                    
                    <div class="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 w-fit px-3 py-1.5 rounded-xl">
                        <i data-lucide="calendar" class="w-4 h-4 text-orange-500"></i>
                        <span>${startDateStr} — ${endDateStr}</span>
                    </div>
                </div>

                <button onclick="deletePromo('${promoDoc.id}')" class="p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <i data-lucide="trash-2" class="w-6 h-6"></i>
                </button>
            </div>`;
        }));

        listContainer.innerHTML = promoCards.join('');
        refreshIcons(); 

    } catch (error) {
        console.error("Error loading promos:", error);
    }
}

// Initial Load
loadPromotions();