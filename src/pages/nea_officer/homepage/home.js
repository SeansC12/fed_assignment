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

  // Get latest inspections (across stalls)
  const q = query(
    collection(db, "inspections"),
    orderBy("updatedAt", "desc"),
    limit(5)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = `<p class="text-slate-400 text-sm">No inspections yet.</p>`;
    return;
  }

  for (const docSnap of snap.docs) {
    const inspection = docSnap.data();
    const stallId = docSnap.id;

    // Fetch stall info
    const stallSnap = await getDoc(doc(db, "hawker-stalls", stallId));
    const stallName = stallSnap.exists()
      ? stallSnap.data().name
      : "Unknown Stall";

    // Flag logic (C / D)
    const flagged = ["C", "D"].includes(inspection.hygieneGrade);

    const card = document.createElement("div");
    card.className =
      "flex justify-between items-start gap-4 p-4 rounded-lg bg-slate-50 border";

    card.innerHTML = `
      <div>
        <p class="font-semibold text-slate-700">${stallName}</p>
        <p class="text-xs text-slate-400 mt-1">
          Submitted: ${
            inspection.updatedAt?.toDate().toLocaleDateString() || "--"
          }
        </p>
        <p class="mt-2 text-slate-600 text-sm">
          ${inspection.remarks}
        </p>
      </div>

      <div class="flex flex-col items-end gap-2">
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
          class="text-sm font-semibold text-[#009481] hover:underline"
        >
          View →
        </a>
      </div>
    `;

    container.appendChild(card);
  }
}

loadRecentInspections();
