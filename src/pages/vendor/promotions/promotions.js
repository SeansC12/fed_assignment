import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc, query, where} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

const stallCache = {};
let activeStallId = "NkfmlElwOWPU0Mb5L40n"; // This will hold the ID once the user logs in


onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Find the stall owned by this user
        const stallsRef = collection(db, "hawker-stalls");
        const q = query(stallsRef, where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            activeStallId = snap.docs[0].id;
            loadPromotions(); // Now safe to load data
        }
    } else {
        //window.location.href = "/src/pages/index.html"; // Send them away if not logged in
        console.log("No user logged in. Defaulting to preview mode.");
    }
    loadPromotions();
});

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
    if (!stallId) return null; // Return null instead of a string
    if (stallCache[stallId]) return stallCache[stallId];
    try {
        const stallSnap = await getDoc(doc(db, "hawker-stalls", stallId));
        if (stallSnap.exists()) {
            stallCache[stallId] = stallSnap.data().name;
            return stallCache[stallId];
        }
    } catch (e) { console.error(e); }
    return null; // Return null if the stall document is missing
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
    const now = new Date(); // Get current date and time
    
    try {
        const promotionsRef = collection(db, "promotions");
        const q = query(promotionsRef, where("stallid", "==", activeStallId)); 
        const querySnapshot = await getDocs(q);
        
        const allPromos = await Promise.all(querySnapshot.docs.map(async (promoDoc) => {
            const data = promoDoc.data();
            const stallName = await getStallName(data.stallid || data.stallId);
            
            if (!stallName) return null;

            return { id: promoDoc.id, data: data, stallName: stallName };
        }));

        const validPromos = allPromos.filter(promo => promo !== null);

        if (validPromos.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-20 text-gray-400">
                    <i data-lucide="package-open" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                    <p>No promotions found for this stall.</p>
                </div>`;
            refreshIcons(); // <--- MUST call this here too!
            return;
        }

        const promoCards = validPromos.map(promo => {
            const { data, stallName, id } = promo;
            const startDateStr = formatDate(data.dateStart);
            const endDateStr = formatDate(data.dateEnd);
            
            // --- EXPIRATION LOGIC ---
            let endDateObj;
            if (data.dateEnd && typeof data.dateEnd.toDate === 'function') {
                endDateObj = data.dateEnd.toDate();
            } else {
                endDateObj = new Date(data.dateEnd);
            }
            
            const isExpired = now > endDateObj;
            // ------------------------

            const displayType = data.affected || "All Items";
            const discountVal = data.discount || "0";

            const typeStyles = {
                mains: "bg-blue-50 text-blue-600 border-blue-100",
                sides: "bg-purple-50 text-purple-600 border-purple-100",
                drinks: "bg-teal-50 text-teal-600 border-teal-100",
                all: "bg-orange-50 text-orange-600 border-orange-100"
            };
            
            const styleKey = displayType.toLowerCase().replace(/\s/g, '');
            const badgeClass = typeStyles[styleKey] || "bg-gray-50 text-gray-500 border-gray-100";

            return `
            <div class="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isExpired ? 'opacity-75 grayscale-[0.5]' : ''}">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        ${isExpired 
                            ? `<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border bg-red-50 text-red-600 border-red-100 flex items-center gap-1">
                                <i data-lucide="clock-alert" class="w-3 h-3"></i> Expired
                               </span>`
                            : `<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border bg-green-50 text-green-600 border-green-100 flex items-center gap-1">
                                <i data-lucide="circle-dot" class="w-3 h-3"></i> Active
                               </span>`
                        }
                        
                        <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border ${badgeClass}">
                            ${displayType}
                        </span>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${stallName}</span>
                    </div>
                    
                    <div class="flex items-baseline gap-3 mb-1">
                        <h3 class="text-2xl font-black text-gray-900">${data.name}</h3>
                        <span class="text-lg font-black ${isExpired ? 'text-gray-400 bg-gray-50' : 'text-green-600 bg-green-50'} px-2 py-0.5 rounded-lg">
                            ${discountVal}% OFF
                        </span>
                    </div>
                    
                    <p class="text-gray-500 mb-4 leading-relaxed">${data.description}</p>
                    
                    <div class="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 w-fit px-3 py-1.5 rounded-xl">
                        <i data-lucide="calendar" class="w-4 h-4 text-orange-500"></i>
                        <span class="${isExpired ? 'text-red-500' : ''}">${startDateStr} — ${endDateStr}</span>
                    </div>
                </div>

                <button onclick="deletePromo('${id}')" class="p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <i data-lucide="trash-2" class="w-6 h-6"></i>
                </button>
            </div>`;
        });

        listContainer.innerHTML = promoCards.join('');
        refreshIcons(); 

    } catch (error) {
        console.error("Error loading promos:", error);
    }
}