import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
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

// HELPER: Format date to HH:SS DD/MM/YYYY
function formatFeedbackDate(dateField) {
  if (!dateField) return "N/A";
  const dateObj = dateField.toDate ? dateField.toDate() : new Date(dateField);
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${hh}:${ss} ${dd}/${mm}/${yyyy}`;
}

async function initFeedbackPage() {
  if (!stallId) return;

  try {
    const stallDoc = await getDoc(doc(db, "hawker-stalls", stallId));
    if (stallDoc.exists()) {
      document.getElementById("stallNameHeader").innerText =
        stallDoc.data().name;
    }

    const [complaintsSnap, reviewsSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, "complaint_list"),
          where("stallId", "==", stallId),
        ),
      ),
      getDocs(
        query(collection(db, "reviews"), where("stallId", "==", stallId)),
      ),
    ]);

    processComplaints(complaintsSnap);
    processReviews(reviewsSnap);
  } catch (error) {
    console.error("Error loading feedback:", error);
  }
}

async function processComplaints(snapshot) {
  const listEl = document.getElementById("complaintsList");
  listEl.innerHTML = "";
  const categories = {};

  if (snapshot.empty) {
    listEl.innerHTML =
      '<p class="text-gray-400 italic text-center py-10">No complaints reported.</p>';
    document.getElementById("topCategory").innerText = "None";
    return;
  }

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const cat = data.category || "General";
    categories[cat] = (categories[cat] || 0) + 1;

    const userSnap = await getDoc(doc(db, "customer_list", data.userId));
    const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";

    // Fixed: Complaints use simple border style, removed getStarSVG and formattedDate (added HH:SS later if needed)
    listEl.innerHTML += `
                        <div class="bg-white p-4 rounded-xl border border-slate-100 hover:border-red-200 hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <span class="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-red-100">${cat}</span>
                                <span class="text-[10px] text-slate-400 font-mono">${data.userEmail}</span>
                            </div>
                            <p class="text-slate-700 mb-3 italic font-medium leading-relaxed">"${data.message || "No message provided."}"</p>
                            <p class="text-xs font-bold text-slate-900">— ${userName}</p>
                        </div>`;
  }

  const mostCommon = Object.keys(categories).reduce((a, b) =>
    categories[a] > categories[b] ? a : b,
  );
  document.getElementById("topCategory").innerText = mostCommon;
  updateGlobalTotal(snapshot.size);
}

async function processReviews(snapshot) {
  const listEl = document.getElementById("reviewsList");
  const starEl = document.getElementById("starContainer");
  listEl.innerHTML = "";
  let totalRating = 0;

  if (snapshot.empty) {
    listEl.innerHTML =
      '<p class="text-gray-400 italic text-center py-10">No reviews yet.</p>';
    document.getElementById("avgRating").innerText = "0";
    return;
  }

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    totalRating += Number(data.rating);

    const userSnap = await getDoc(doc(db, "customer_list", data.customerID));
    const userName = userSnap.exists() ? userSnap.data().name : "Customer";

    // Fixed: Call the formatter inside the loop
    const formattedDate = formatFeedbackDate(data.date);

    listEl.innerHTML += `
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition">
                            <div class="flex items-center gap-1 mb-2 text-yellow-500 text-xs">
                                ${Array(5)
                                  .fill(0)
                                  .map(
                                    (_, i) =>
                                      `<i class="fa-${i < data.rating ? "solid" : "regular"} fa-star"></i>`,
                                  )
                                  .join("")}
                            </div>
                            <p class="text-slate-700 mb-3 text-sm italic">"${data.comment || "No comment provided."}"</p>
                            <div class="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>${userName}</span>
                                <span>${formattedDate}</span>
                            </div>
                        </div>`;
  }

  const avg = (totalRating / snapshot.size).toFixed(1);
  document.getElementById("avgRating").innerText = avg;
  starEl.innerHTML = Array(5)
    .fill(0)
    .map(
      (_, i) =>
        `<i class="fa-${i < Math.round(avg) ? "solid" : "regular"} fa-star"></i>`,
    )
    .join("");
  updateGlobalTotal(snapshot.size);
}

let totalFeedbackCount = 0;
function updateGlobalTotal(n) {
  totalFeedbackCount += n;
  document.getElementById("totalCount").innerText = totalFeedbackCount;
}

initFeedbackPage();
