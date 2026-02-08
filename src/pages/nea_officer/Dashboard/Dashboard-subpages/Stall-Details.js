import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const urlParams = new URLSearchParams(window.location.search);
const stallId = urlParams.get("id");

// UPDATE SECONDARY NAV LINKS
if (stallId) {
    const navDetails = document.getElementById('nav-details');
    const navFeedback = document.getElementById('nav-feedback');

    navDetails.href = `Stall-Details.html?id=${stallId}`;
    navFeedback.href = `Customer-Feedback.html?id=${stallId}`;

    const currentPage = window.location.pathname;
    // We use a stronger highlight (bg-white/30) since the text is now black
    if (currentPage.includes("Stall-Details.html")) {
        navDetails.classList.add("bg-white/40", "opacity-100", "ring-1", "ring-white/50");
    } else if (currentPage.includes("Customer-Feedback.html")) {
        navFeedback.classList.add("bg-white/40", "opacity-100", "ring-1", "ring-white/50");
    }
    
    // INITIALIZE LUCIDE ICONS
    lucide.createIcons();
}

async function loadStallDetails() {
  if (!stallId) return;

  try {
    // 1. Fetch Stall & Owner
    const stallDoc = await getDoc(doc(db, "hawker-stalls", stallId));
    if (stallDoc.exists()) {
      const stallData = stallDoc.data();
      updateStallUI(stallData);

      if (stallData.ownerId) {
        const ownerDoc = await getDoc(
          doc(db, "vendor_list", stallData.ownerId),
        );
        if (ownerDoc.exists())
          updateOwnerUI(ownerDoc.data(), stallData.ownerId);
      }
    }

    // 2. Fetch Inspections & Summarize
    await loadInspections();
  } catch (error) {
    console.error("Detail Page Error:", error);
  }
}

async function loadInspections() {
  const tableBody = document.getElementById("inspectionTableBody");
  const q = query(
    collection(db, "inspections"),
    where("stallId", "==", stallId),
    orderBy("timestamp", "desc"),
  );
  const querySnapshot = await getDocs(q);

  // Stats Counters
  const counts = { A: 0, B: 0, C: 0, D: 0 };

  const rows = await Promise.all(
    querySnapshot.docs.map(async (inspectionDoc) => {
      const insp = inspectionDoc.data();

      // Count for stats
      if (counts.hasOwnProperty(insp.grade)) counts[insp.grade]++;

      // Fetch Officer by FIELD 'officerId'
      let officerName = "Unknown Officer";
      if (insp.officerId) {
        const offQuery = query(
          collection(db, "nea-officer"),
          where("officerId", "==", insp.officerId),
        );
        const offSnap = await getDocs(offQuery);
        if (!offSnap.empty) officerName = offSnap.docs[0].data().name;
      }

      return renderTableRow(inspectionDoc.id, insp, officerName);
    }),
  );

  tableBody.innerHTML = rows.join("");
  updateStatsUI(counts);
}

// UI Helper Functions
function updateStatsUI(counts) {
  document.getElementById("countA").textContent = counts.A;
  document.getElementById("countB").textContent = counts.B;
  document.getElementById("countC").textContent = counts.C;
  document.getElementById("countD").textContent = counts.D;
}

// --- UI Helper Functions ---

function updateStallUI(data) {
  document.getElementById("stallName").textContent = data.name || "N/A";
  document.getElementById("stallAddress").textContent =
    `UNIT ${data.address || "---"}`;
  document.getElementById("displayStallId").textContent = stallId;
  document.getElementById("displayHawkerCentre").textContent =
    data.hawkerCentre || "N/A";

  const imgElement = document.getElementById("stallImage");
  const placeholder = document.getElementById("imagePlaceholder");

  if (data.image) {
    imgElement.src = data.image;
    imgElement.classList.remove("hidden");
    placeholder.classList.add("hidden");
  }
}

function updateOwnerUI(data, id) {
  document.getElementById("ownerName").textContent = data.name || "Unknown";
  document.getElementById("ownerInitial").textContent = (
    data.name || "?"
  ).charAt(0);
  document.getElementById("ownerIdDisplay").textContent = id;
}

function getGradeColor(grade) {
  switch (grade) {
    case "A":
      return "bg-green-500";
    case "B":
      return "bg-[#009481]";
    case "C":
      return "bg-orange-400";
    case "D":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

function renderTableRow(id, insp, officerName) {
  const date = insp.timestamp?.toDate
    ? insp.timestamp.toDate().toLocaleDateString("en-SG")
    : "N/A";
  return `
        <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.location.href='../inspection-detail.html?id=${id}'">
            <td class="px-6 py-4"><span class="bg-[#009481] text-white p-2 rounded font-bold">${insp.grade}</span></td>
            <td class="px-6 py-4 font-medium">${officerName}</td>
            <td class="px-6 py-4 text-xs font-mono">${insp.officerId}</td>
            <td class="px-6 py-4 text-sm">${date}</td>
            <td class="px-6 py-4 text-right text-[#009481] font-bold">View →</td>
        </tr>
    `;
}

lucide.createIcons();

loadStallDetails();