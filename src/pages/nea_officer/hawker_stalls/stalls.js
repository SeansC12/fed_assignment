import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
    authDomain: "fed-assignment-f1456.firebaseapp.com",
    projectId: "fed-assignment-f1456",
    storageBucket: "fed-assignment-f1456.firebasestorage.app",
    messagingSenderId: "646434763443",
    appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6"
};  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const stallsGrid = document.getElementById("stallsGrid");
const hawkerFilter = document.getElementById("hawkerFilter");
let allStalls = [];

// Fetch and listen to Firestore collection
const stallsRef = collection(db, "hawker-stalls");

onSnapshot(stallsRef, (snapshot) => {
    allStalls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Fetched stalls:", allStalls);

    updateFilterOptions();
    renderStalls();
}, (error) => {
    console.error("Firebase Error:", error);
    stallsGrid.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold">Error: ${error.message}</p>`;
});

// Populate dropdown
function updateFilterOptions() {
    const centres = [...new Set(allStalls.map(s => s.hawkerCentre).filter(Boolean))].sort();
    hawkerFilter.innerHTML = `<option value="all">All Hawker Centres</option>`;
    centres.forEach(centre => {
        const opt = document.createElement("option");
        opt.value = centre;
        opt.textContent = centre;
        hawkerFilter.appendChild(opt);
    });
}

// Render stalls
function renderStalls() {
    const selected = hawkerFilter.value || "all";
    const filtered = selected === "all"
        ? allStalls
        : allStalls.filter(s => s.hawkerCentre === selected);

    stallsGrid.innerHTML = "";

    if (filtered.length === 0) {
        stallsGrid.innerHTML = `<p class="col-span-full text-center py-10">No stalls found for this centre.</p>`;
        return;
    }

    filtered.forEach(stall => {
        const card = document.createElement("div");
        card.className = "bg-white border-2 border-slate-300 rounded-xl shadow-sm hover:shadow-md transition w-full flex flex-col cursor-pointer";

        card.innerHTML = `
            <div class="bg-slate-200 w-full h-48 rounded-t-xl overflow-hidden flex items-center justify-center">
                ${stall.image ? `<img src="${stall.image}" class="w-full h-full object-cover" />` : `<span class="text-slate-400">No Image</span>`}
            </div>
            <div class="p-4 flex flex-col justify-between grow">
                <div>
                    <p class="text-xl font-semibold text-slate-800">${stall.name || "Unnamed Stall"}</p>
                    <p class="text-sm text-slate-500 mt-1">${stall.address || "No Address"}</p>
                    <p class="text-xs text-[#009481] font-bold mt-1 uppercase">${stall.hawkerCentre || ""}</p>
                </div>
                <div class="mt-4 flex justify-between items-center text-xs text-slate-400 border-t pt-3">
                    <span>Status: Active</span>
                    <span class="text-rose-500 font-bold">❤️ ${stall.hearts ?? 0}</span>
                </div>
            </div>
        `;

        card.onclick = () => {
            localStorage.setItem("selectedStallId", stall.id);
            window.location.href = "/src/pages/nea_officer/flagged-stalls/flagged_stallinfo.html";
        };

        stallsGrid.appendChild(card);
    });
}

// Filter change
hawkerFilter.addEventListener("change", renderStalls);