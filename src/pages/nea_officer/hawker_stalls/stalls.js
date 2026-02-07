import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
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

// ===== DOM ELEMENTS =====
const stallsGrid = document.getElementById("stallsGrid");
const hawkerFilter = document.getElementById("hawkerFilter");

let allStalls = [];

// ===== REAL-TIME LISTENER =====
const stallsRef = collection(db, "hawker-stalls");

onSnapshot(stallsRef, (snapshot) => {
  // Map each doc into an object with its ID
  allStalls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  populateFilter(); // Populate dropdown dynamically
  renderStalls();   // Render stalls
});

// ===== POPULATE DROPDOWN =====
function populateFilter() {
  // Collect unique hawker centres
  const centres = [...new Set(allStalls.map(s => s.hawkerCentre || "Unknown"))].sort();

  hawkerFilter.innerHTML = `<option value="all">All Hawker Centres</option>`;
  centres.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    hawkerFilter.appendChild(option);
  });
}

// ===== RENDER STALLS =====
function renderStalls() {
  const selectedCentre = hawkerFilter.value;
  const stallsToShow = selectedCentre === "all"
    ? allStalls
    : allStalls.filter(s => s.hawkerCentre === selectedCentre);

  stallsGrid.innerHTML = "";

  stallsToShow.forEach(stall => {
    const div = document.createElement("div");
    div.className = "bg-slate-50 border-2 border-slate-300 rounded-xl shadow-sm hover:shadow-md transition w-95 h-112.5 flex flex-col cursor-pointer";

    div.innerHTML = `
      <div class="bg-slate-200 w-full h-80 rounded-t-xl flex items-center justify-center text-slate-400 font-medium">
        ${stall.image ? `<img src="${stall.image}" alt="${stall.name}" class="object-cover w-full h-full rounded-t-xl">` : "No Image"}
      </div>
      <div class="p-5 flex flex-col justify-between grow">
        <div>
          <p class="text-xl font-semibold text-slate-800">${stall.name || "Unnamed Stall"}</p>
          <p class="text-sm text-slate-500 mt-1">${stall.address || "No Address"}</p>
        </div>
        <div class="mt-3 flex flex-col text-xs text-slate-400 gap-1">
          <span>Hawker Centre: ${stall.hawkerCentre || "Unknown"}</span>
          <span>Cuisine: ${Array.isArray(stall.cuisineTypes) ? stall.cuisineTypes.join(", ") : "N/A"}</span>
          <span>Created: ${stall.createdAt ? new Date(stall.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</span>
          <span>Last Updated: ${stall.lastUpdated ? new Date(stall.lastUpdated.seconds * 1000).toLocaleDateString() : "N/A"}</span>
        </div>
      </div>
    `;

    div.addEventListener("click", () => {
      localStorage.setItem("selectedStallId", stall.id);
      window.location.href = "stall_details.html"; // Navigate to stall details page
    });

    stallsGrid.appendChild(div);
  });
}

// ===== Re-render stalls when dropdown changes =====
hawkerFilter.addEventListener("change", renderStalls);
