import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function initializeSecondaryNav() {
  // Get stall ID from URL first, then fall back to localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get("id");
  const storageId = localStorage.getItem("selectedStallId");
  const stallId = urlId || storageId;
  
  console.log("Initializing nav with stall ID:", stallId);
  
  if (!stallId) {
    console.warn("No stall ID found for navigation");
    return;
  }
  
  // Sync to localStorage for consistency
  localStorage.setItem("selectedStallId", stallId);
  
  // Define navigation links
  const navLinks = [
    { id: 'nav-home', url: 'flagged_stallinfo.html' },
    { id: 'nav-dashboard', url: '../Stall-Statistics/Stall-Statistics.html' },
    { id: 'nav-grade', url: '../submit-grade/submit_grade.html' },
    { id: 'nav-feedback', url: '../Customer-Feedback/Customer-Feedback.html' }
  ];
  
  const currentPage = window.location.pathname;
  
  navLinks.forEach(link => {
    const element = document.getElementById(link.id);
    if (!element) {
      console.warn("Nav element not found:", link.id);
      return;
    }
    
    // Set the full href with stall ID
    const fullUrl = link.url + '?id=' + encodeURIComponent(stallId);
    element.href = fullUrl;
    console.log(`Set ${link.id} to:`, fullUrl);
    
    // Highlight current page
    if (currentPage.includes(link.url.replace('../', '').split('/').pop())) {
      element.classList.remove('border-transparent');
      element.classList.add('border-slate-400');
    }
  });
}

/* ================= DOM ================= */
const stallNameEl = document.getElementById("stall-name");
const stallIdEl = document.getElementById("stall-id");
const stallAddressEl = document.getElementById("stall-address");
const stallHawkerEl = document.getElementById("stall-hawker");
const stallCuisineEl = document.getElementById("stall-cuisine");
const stallImageEl = document.getElementById("stall-image");
const currentGradeEl = document.getElementById("current-grade");
const vendorNameEl = document.getElementById("vendor-name");
const vendorEmailEl = document.getElementById("vendor-email");
const pastInspectionsBody = document.getElementById("past-inspections-body");

/* ================= LOCAL STORAGE ================= */
const stallId = localStorage.getItem("selectedStallId");
if (!stallId) {
  alert("No stall selected.");
}

/* ================= LOAD DATA ================= */
async function loadStallInfo() {
  /* ===== Stall ===== */
  const stallSnap = await getDoc(doc(db, "hawker-stalls", stallId));
  if (!stallSnap.exists()) {
    alert("Stall not found.");
    return;
  }

  const stall = stallSnap.data();
  stallNameEl.textContent = stall.name || "--";
  stallIdEl.textContent = `Stall ID: ${stallId}`;
  stallAddressEl.textContent = `Address: ${stall.address || "--"}`;
  stallHawkerEl.textContent = `Hawker Centre: ${stall.hawkerCentre || "--"}`;
  stallCuisineEl.textContent = `Cuisine: ${(stall.cuisineTypes || []).join(", ") || "--"}`;

  if (stall.image) {
    stallImageEl.innerHTML = `
      <img src="${stall.image}" class="w-full h-full object-cover rounded-xl" />
    `;
  }

  /* ===== Vendor ===== */
  const vendorQuery = query(
    collection(db, "vendor_list"),
    where("stallId", "==", stallId)
  );

  const vendorSnap = await getDocs(vendorQuery);
  if (!vendorSnap.empty) {
    const vendor = vendorSnap.docs[0].data();
    vendorNameEl.textContent = vendor.name || "--";
    vendorEmailEl.textContent = vendor.email || "--";
  }

  /* ===== Current Inspection ===== */
  const inspectionSnap = await getDoc(doc(db, "inspections", stallId));
  if (inspectionSnap.exists()) {
    const data = inspectionSnap.data();
    currentGradeEl.textContent = data.hygieneGrade || "--";
  }

  /* ===== Past Inspections ===== */
  const historyRef = collection(db, "inspections", stallId, "history");
  const historySnap = await getDocs(
    query(historyRef, orderBy("inspectedAt", "desc"))
  );

  pastInspectionsBody.innerHTML = "";

  historySnap.docs.forEach(docSnap => {
    const d = docSnap.data();
    const row = document.createElement("tr");
    row.className = "hover:bg-slate-50 transition-colors";

    row.innerHTML = `
      <td class="border border-slate-300 px-4 py-2">
        <span class="inline-block px-2 py-1 rounded-full bg-[#009481] text-white font-semibold">
          ${d.grade || "--"}
        </span>
      </td>
      <td class="border border-slate-300 px-4 py-2">
        ${d.remarks || "--"}
      </td>
    `;

    pastInspectionsBody.appendChild(row);
  });
}

initializeSecondaryNav();

loadStallInfo();