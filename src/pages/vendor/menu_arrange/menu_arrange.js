import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REPLACE WITH YOUR CONFIG
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
const menuCol = collection(db, "vendor_menu");

let menuData = [];
let activeFilter = "All";
let activeSearch = "";

// 1. REAL-TIME LISTENER (replaces LocalStorage loading)
onSnapshot(menuCol, (snapshot) => {
  menuData = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  renderItems();
});

function renderItems() {
  const grid = document.getElementById("menu-grid");
  const filteredData = menuData.filter((item) => {
    const matchesCat = activeFilter === "All" || item.category === activeFilter;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(activeSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filteredData.length === 0) {
    grid.innerHTML = `
            <div class="col-span-full text-center py-20rounded-2xl border-2 border-dashed border-gray-200">
                <i data-lucide="search-x" class="w-12 h-12 mx-auto text-gray-300 mb-2"></i>
                <p class="text-gray-500 font-medium">No items found.</p>
            </div>`;
  } else {
    grid.innerHTML = filteredData
      .map(
        (item) => `
            <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div class="h-52 bg-gray-100 relative border-b border-gray-100 overflow-hidden">
                    <img src="${item.image}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400x300?text=Food+Image'">
                    <span class="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-black text-gray-800 shadow-sm border border-gray-100">
                        $${Number(item.price).toFixed(2)}
                    </span>
                </div>
                <div class="p-6 flex-1">
                    <span class="text-[10px] font-black tracking-widest text-orange-primary uppercase px-2 py-1 bg-orange-50 rounded">${item.category}</span>
                    <h3 class="text-xl font-bold text-gray-900 mt-2">${item.name}</h3>
                    <p class="text-gray-500 text-sm mt-2 line-clamp-2">${item.desc}</p>
                </div>
                <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full ${item.stock ? "bg-green-500 animate-pulse" : "bg-red-400"}"></div>
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-tight">${item.stock ? "Available" : "Sold Out"}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editItem('${item.id}')" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteItem('${item.id}')" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>`,
      )
      .join("");
  }
  lucide.createIcons();
}

// 2. DELETE FROM FIREBASE
async function deleteItem(id) {
  const item = menuData.find((i) => i.id === id);
  if (confirm(`Delete "${item.name}" from the menu?`)) {
    try {
      await deleteDoc(doc(db, "vendor_menu", id));
    } catch (e) {
      alert("Error deleting item: " + e.message);
    }
  }
}

// 3. FILTER & SEARCH LOGIC
window.filterByCategory = (category) => {
  activeFilter = category;
  document.getElementById("filterMenu").classList.add("hidden");
  renderItems();
};

document.getElementById("searchInput").addEventListener("input", (e) => {
  activeSearch = e.target.value;
  renderItems();
});

// 4. UI DROPDOWN LOGIC
const filterBtn = document.getElementById("filterBtn");
const filterMenu = document.getElementById("filterMenu");

filterBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  filterMenu.classList.toggle("hidden");
});

window.addEventListener("click", () => filterMenu.classList.add("hidden"));

// Expose functions to window (needed because we are in a module)
window.deleteItem = deleteItem;
window.editItem = (id) => {
    window.location.href = `../menu_edit/menu_edit.html?id=${id}`;
};

lucide.createIcons();
