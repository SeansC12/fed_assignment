import { db, collection, onSnapshot } from "./firebase.js";

// Elements
const stallsGrid = document.getElementById("stallsGrid");
const hawkerFilter = document.getElementById("hawkerFilter");

let allStalls = [];

// Real-time listener
const stallsRef = collection(db, "hawker-stalls");

onSnapshot(stallsRef, (snapshot) => {
  allStalls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  populateFilter();
  renderStalls();
});

// Populate hawker centre dropdown
function populateFilter() {
  const centres = [...new Set(allStalls.map(s => s.hawkerCentre))].sort();
  hawkerFilter.innerHTML = `<option value="all">All Hawker Centres</option>`;
  centres.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    hawkerFilter.appendChild(option);
  });
}

// Render stalls
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
        ${stall.image || "No Image"}
      </div>
      <div class="p-5 flex flex-col justify-between grow">
        <div>
          <p class="text-xl font-semibold text-slate-800">${stall.name}</p>
          <p class="text-sm text-slate-500 mt-1">${stall.address}</p>
        </div>
        <div class="mt-3 flex justify-between text-xs text-slate-400">
          <span>Status: Active</span>
          <span>Revenue: $${stall.revenue || 0}</span>
        </div>
      </div>
    `;

    div.addEventListener("click", () => {
      localStorage.setItem("selectedStallId", stall.id);
      window.location.href = "stall_details.html";
    });

    stallsGrid.appendChild(div);
  });
}

// Re-render when filter changes
hawkerFilter.addEventListener("change", renderStalls);
