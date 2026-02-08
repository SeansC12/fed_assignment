import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  orderBy,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= DOM ================= */
const container = document.getElementById("recent-inspections");

/* ================= LOAD RECENT INSPECTIONS ================= */
async function loadRecentInspections() {
  container.innerHTML = "";

  const q = query(
    collection(db, "inspections"),
    orderBy("updatedAt", "desc"),
    limit(5)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML =
      `<p class="text-slate-400 text-sm">No inspections yet.</p>`;
    return;
  }

  for (const docSnap of snap.docs) {
    const inspection = docSnap.data();
    const stallId = docSnap.id;

    /* ===== FETCH STALL INFO ===== */
    const stallSnap = await getDoc(doc(db, "hawker-stalls", stallId));
    const stallName = stallSnap.exists()
      ? stallSnap.data().name
      : "Unknown Stall";

    /* ===== FLAG LOGIC ===== */
    const flagged = ["C", "D"].includes(inspection.hygieneGrade);

    /* ===== CARD ===== */
    const card = document.createElement("div");
    card.className =
      "flex flex-col md:flex-row md:justify-between md:items-start gap-4 p-4 rounded-lg bg-slate-50 border";

    card.innerHTML = `
      <!-- LEFT CONTENT -->
      <div class="flex-1">
        <p class="font-semibold text-slate-700">${stallName}</p>
        <p class="text-xs text-slate-400 mt-1">
          Submitted: ${
            inspection.updatedAt?.toDate().toLocaleDateString() || "--"
          }
        </p>
        <p class="mt-2 text-slate-600 text-sm">
          ${inspection.remarks || "No remarks provided."}
        </p>
      </div>

      <!-- RIGHT ACTIONS -->
      <div class="flex flex-row md:flex-col md:items-end gap-3 md:gap-2">
        ${
          flagged
            ? `<span class="px-3 py-1 text-xs rounded-full bg-orange-500 text-white font-bold">
                Flagged
               </span>`
            : `<span class="px-3 py-1 text-xs rounded-full bg-green-500 text-white font-bold">
                OK
               </span>`
        }

        <a
          href="../flagged-stalls/flagged_stallinfo.html"
          onclick="localStorage.setItem('selectedStallId', '${stallId}')"
          class="text-sm font-semibold text-[#009481] hover:underline whitespace-nowrap px-3 py-1 md:px-0 md:py-0"
        >
          View →
        </a>
      </div>
    `;

    container.appendChild(card);
  }
}

/* ================= INIT ================= */
loadRecentInspections();
