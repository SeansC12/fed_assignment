import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    getDoc,
    getDocs, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);

const container = document.getElementById('complaints-container');
const countBadge = document.getElementById('complaint-count');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const stallsRef = collection(db, "hawker-stalls");
        const qStall = query(stallsRef, where("ownerId", "==", user.uid));
        const stallSnap = await getDocs(qStall);

        if (!stallSnap.empty) {
            const stallId = stallSnap.docs[0].id;
            listenToComplaints(stallId);
        }
    }
});

window.resolveComplaint = async (id) => {
    if (!confirm("Mark this complaint as completed?")) return;
    try {
        await updateDoc(doc(db, "complaint_list", id), { status: "completed" });
    } catch (error) {
        console.error("Resolve failed:", error);
    }
};

async function getCustomerName(userId) {
    if (!userId) return "Unknown User";
    try {
        const snap = await getDoc(doc(db, "customer_list", userId));
        return snap.exists() ? (snap.data().email || snap.data().customerName || "Customer") : "Guest";
    } catch { return "Customer"; }
}

function listenToComplaints(stallId) {
    // Only filter by stallId to avoid index requirement
    const q = query(collection(db, "complaint_list"), where("stallId", "==", stallId));

    onSnapshot(q, async (snapshot) => {
        // STEP 1: Turn snapshots into plain objects immediately
        const allItems = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        // STEP 2: Filter for 'pending' items
        const pendingItems = allItems.filter(item => item.status === 'pending');

        // STEP 3: Sort by date (latest first)
        pendingItems.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (countBadge) countBadge.innerText = `${pendingItems.length} Pending Complaints`;

        if (pendingItems.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400">All caught up!</div>`;
            return;
        }

        // STEP 4: Render
        const htmlPromises = pendingItems.map(async (complaint) => {
            const name = await getCustomerName(complaint.userId);

            // 1. Convert the String to a JS Date Object
            // JavaScript's new Date() handles "2026-02-07T13:48..." perfectly
            const dateObj = complaint.createdAt ? new Date(complaint.createdAt) : null;

            // 2. Format for Singapore/Display
            let dateDisplay = "Just now";
            
            if (dateObj && !isNaN(dateObj.getTime())) {
                dateDisplay = dateObj.toLocaleDateString('en-SG', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }

            return `
                <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-5 flex flex-col">
                    <div class="h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                        <img src="${complaint.image}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400x300?text=No+Photo'">
                    </div>
                    <div class="flex justify-between mb-4">
                        <div>
                            <p class="text-[10px] uppercase font-bold text-gray-400">Customer</p>
                            <h4 class="font-bold">${name}</h4>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] uppercase font-bold text-gray-400">Time</p>
                            <span class="text-xs text-gray-600">${dateDisplay}</span>
                        </div>
                    </div>
                    <div class="bg-orange-50 rounded-xl p-4 mb-4 flex-1">
                        <p class="text-sm italic">"${complaint.message || 'No details.'}"</p>
                    </div>
                    <button onclick="resolveComplaint('${complaint.id}')" 
                            class="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                        Mark as Completed
                    </button>
                </div>`;
        });

        const finalHtml = await Promise.all(htmlPromises);
        container.innerHTML = finalHtml.join('');
        if (window.lucide) lucide.createIcons();
    });
}