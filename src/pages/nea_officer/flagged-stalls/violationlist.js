import { db } from "../../../js/firebase.js";
import { collection, getDocs } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const container = document.getElementById("stallsContainer");

async function loadStalls() {
  const snapshot = await getDocs(collection(db, "hawker-stalls"));

  snapshot.forEach(doc => {
    const stall = doc.data();

    if (!stall.Flagged) return;

    const card = document.createElement("div");
    card.className = `
      bg-white border rounded-xl shadow w-[360px] h-[420px]
      flex flex-col
    `;

    card.innerHTML = `
      <div class="bg-slate-200 h-[260px] flex items-center justify-center">
        Stall Image
      </div>
      <div class="p-4 grow flex flex-col justify-between">
        <div>
          <p class="font-bold text-lg">${stall.Name}</p>
          <p class="text-sm text-slate-500">${stall.UnitNumber}</p>
        </div>
        <div class="text-sm text-slate-400">
          Revenue: $${stall.Revenue || 0}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

loadStalls();
