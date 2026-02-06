import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
    authDomain: "fed-assignment-f1456.firebaseapp.com",
    projectId: "fed-assignment-f1456",
    storageBucket: "fed-assignment-f1456.firebasestorage.app",
    messagingSenderId: "646434763443",
    appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allStalls = []; // Global state to hold fetched data

async function loadStalls() {
    const querySnapshot = await getDocs(collection(db, "hawker-stalls"));
    
    allStalls = [];
    const centersSet = new Set();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        allStalls.push({ id: doc.id, ...data });
        if (data.hawkerCentre) centersSet.add(data.hawkerCentre);
    });

    populateFilter(centersSet);
    renderStalls(allStalls);
}

// Populate the dropdown with unique Hawker Center names
function populateFilter(centers) {
    const dropdown = document.getElementById('hawkerFilter');
    Array.from(centers).sort().forEach(center => {
        const opt = document.createElement('option');
        opt.value = center;
        opt.textContent = center;
        dropdown.appendChild(opt);
    });
}

// Filter and Render logic
function handleFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCenter = document.getElementById('hawkerFilter').value;

    const filtered = allStalls.filter(stall => {
        const matchesSearch = stall.name.toLowerCase().includes(searchTerm);
        const matchesCenter = selectedCenter === "all" || stall.hawkerCentre === selectedCenter;
        return matchesSearch && matchesCenter;
    });

    renderStalls(filtered);
}

function renderStalls(stalls) {
    const grid = document.getElementById('stallGrid');
    grid.innerHTML = stalls.length ? '' : '<p class="col-span-full text-center text-slate-400 py-10">No stalls found matching your criteria.</p>';

    stalls.forEach(stall => {
        const card = `
            <div onclick="window.location.href='stall_detail.html?id=${stall.id}'" 
                class="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:border-[#009481] cursor-pointer transition-all transform hover:-translate-y-1">
                
                <div class="h-40 bg-slate-100 overflow-hidden">
                    <img src="${stall.image || '/static/placeholder.png'}" 
                        alt="${stall.name}" 
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </div>

                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                            UNIT ${stall.address}
                        </span>
                    </div>
                    <h3 class="font-bold text-slate-800 leading-tight h-10 overflow-hidden line-clamp-2">${stall.name}</h3>
                    <p class="text-xs text-slate-400 mt-2 flex items-center">
                        <span class="mr-1">📍</span> ${stall.hawkerCentre}
                    </p>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
}

// Event Listeners
document.getElementById('searchInput').addEventListener('input', handleFilters);
document.getElementById('hawkerFilter').addEventListener('change', handleFilters);

// Run on load
loadStalls();