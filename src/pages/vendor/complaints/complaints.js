import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, // Added for filtering
    orderBy, 
    onSnapshot, 
    doc, 
    getDoc, 
    updateDoc // Changed from deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const container = document.getElementById('complaints-container');
const countBadge = document.getElementById('complaint-count');

/**
 * RESOLVE FUNCTION
 * Updates status to 'completed'
 */
window.resolveComplaint = async (id) => {
    if (!confirm("Mark this complaint as completed?")) return;
    
    try {
        const docRef = doc(db, "complaint_list", id);
        // Updates the status field to 'completed'
        await updateDoc(docRef, {
            status: "completed"
        });
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status. Make sure the document exists.");
    }
};

async function getCustomerName(userId) {
    if (!userId) return "Unknown User";
    try {
        const customerDoc = await getDoc(doc(db, "customer_list", userId));
        return customerDoc.exists() ? (customerDoc.data().email || "Unnamed Customer") : "Unknown Customer";
    } catch (e) {
        return "Error loading name";
    }
}

// FETCH AND RENDER
function listenToComplaints() {
    // 1. SIMPLIFIED QUERY: Remove the 'where' filter. 
    // This removes the need for a composite index.
    const q = query(
        collection(db, "complaint_list"), 
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, async (snapshot) => {
        // 2. JS FILTERING: Filter for 'pending' items here in code instead
        const pendingDocs = snapshot.docs.filter(docSnap => docSnap.data().status === 'pending');

        if (pendingDocs.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-gray-400 font-medium">No pending complaints. All caught up!</p>
                </div>`;
            countBadge.innerText = "0 Pending";
            return;
        }

        countBadge.innerText = `${pendingDocs.length} Pending Complaints`;

        // Use pendingDocs instead of snapshot.docs
        const complaintPromises = pendingDocs.map(async (docSnap) => {
            const data = docSnap.data();
            const customerName = await getCustomerName(data.userId);
            
            const date = data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-SG', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }) : "Recently";

            return `
                <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div class="h-48 bg-gray-100 relative">
                        <img src="${data.image}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400x300?text=No+Photo'">
                        <div class="absolute top-3 left-3">
                            <span class="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm">
                                ${data.category || 'General'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="p-5 flex-1 flex flex-col">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Customer</p>
                                <h4 class="font-bold text-gray-900">${customerName}</h4>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Time</p>
                                <span class="text-xs font-medium text-gray-600">${date}</span>
                            </div>
                        </div>

                        <div class="bg-orange-50/50 rounded-xl p-4 mb-6 border border-orange-100 flex-1">
                            <p class="text-sm text-gray-700 leading-relaxed italic">
                                "${data.message || 'No specific details provided.'}"
                            </p>
                        </div>
                        
                        <div class="flex gap-2">
                            <button onclick="resolveComplaint('${docSnap.id}')" 
                                    class="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
                                Mark as Completed
                            </button>
                        </div>
                    </div>
                </div>`;
        });

        const complaintHtmlArray = await Promise.all(complaintPromises);
        container.innerHTML = complaintHtmlArray.join('');
        if (window.lucide) lucide.createIcons();
    });
}
if (window.lucide) lucide.createIcons();


listenToComplaints();