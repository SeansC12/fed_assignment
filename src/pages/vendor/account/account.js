import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc,
    onSnapshot,
    updateDoc, 
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);

let currentStallId = null;
let currentAgreementId = null;

if (window.lucide) lucide.createIcons();

//AUTH & DATA LOADING
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const vendorDocRef = doc(db, "vendor_list", user.uid);
            const vendorSnap = await getDoc(vendorDocRef);

            let vendorData = null;
            if (vendorSnap.exists()) {
                vendorData = vendorSnap.data();
                document.getElementById("vendorName").textContent = vendorData.name || "Unknown Vendor";
                document.getElementById("vendorEmail").textContent = vendorData.email || user.email;
                if (vendorData.stallId) currentStallId = vendorData.stallId;
            }

            const seed = vendorData?.email || user.email;
            document.getElementById("profileAvatar").src = `https://ui-avatars.com/api/?name=${seed}&background=fff7ed&color=ea580c`;

            if (!currentStallId) {
                const stallsRef = collection(db, "hawker-stalls");
                const qStall = query(stallsRef, where("ownerId", "==", user.uid));
                const stallSnap = await getDocs(qStall);
                if (!stallSnap.empty) currentStallId = stallSnap.docs[0].id;
            }

            if (currentStallId) {
                loadStallDetails(currentStallId);
                fetchRentalAgreement(currentStallId);
            } else {
                document.getElementById("displayStallName").textContent = "No Stall Linked";
            }
        } catch (error) {
            console.error("Account loading error:", error);
        }
    } else {
        window.location.href = "../vendor_login/vendor-login.html";
    }
});

//STALL DETAILS (REAL-TIME)
function loadStallDetails(id) {
    const stallRef = doc(db, "hawker-stalls", id);
    onSnapshot(stallRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("displayStallName").textContent = data.name || "N/A";
            document.getElementById("displayLocation").textContent = data.address || "N/A";
            
            const cuisineData = data.cuisineTypes;
            document.getElementById("displayCuisine").textContent = 
                Array.isArray(cuisineData) ? cuisineData.join(", ") : (cuisineData || "General");
            
            document.getElementById("displayOwnerId").textContent = id;
        }
    });
}

// RENTAL AGREEMENT HANDLING
function fetchRentalAgreement(stallId) {
    if (!stallId) return;

    const rentalRef = collection(db, "rental_agreements");
    const q = query(rentalRef, where("stallId", "==", stallId));

    // Using onSnapshot for real-time updates to the agreement
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            renderNoAgreementState();
            return;
        }

        const docSnap = snapshot.docs[0];
        currentAgreementId = docSnap.id;
        const data = docSnap.data();

        // Update UI Elements
        const idEl = document.getElementById("rentalIdDisplay");
        const feeEl = document.getElementById("rentalFee");
        const imgEl = document.getElementById("agreementImage");
        const linkEl = document.getElementById("agreementLink");

        if(idEl) idEl.textContent = `Ref: ${docSnap.id}`;
        if(feeEl) feeEl.textContent = `$${Number(data.fee || 0).toFixed(2)}`;
        
        // Handle Thumbnail Image
        if (data.image && imgEl) {
            imgEl.src = data.image;
        }

        // Handle Clickable Link (PDF or external document)
        if (linkEl) {
            // Prioritize pdfUrl field, fallback to image if it's a URL
            const destination = data.pdfUrl || (data.image?.startsWith('http') ? data.image : "#");
            linkEl.href = destination;
            
            if (destination === "#") {
                linkEl.style.cursor = "default";
                linkEl.onclick = (e) => e.preventDefault();
            }
        }

        // Date Handling
        let lastRenewed = data.dateRenewed?.toDate ? data.dateRenewed.toDate() : new Date(data.dateRenewed || Date.now());
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);

        document.getElementById("lastRenewedDate").textContent = lastRenewed.toLocaleDateString('en-SG', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });

        const nextDue = new Date(lastRenewed);
        nextDue.setMonth(nextDue.getMonth() + 1);
        document.getElementById("nextRenewDate").textContent = nextDue.toLocaleDateString('en-SG');

        updateRentalUI(lastRenewed < oneMonthAgo);
    });
}

function updateRentalUI(isExpired) {
    const badge = document.getElementById("statusBadge");
    const actionArea = document.getElementById("actionArea");

    if (isExpired) {
        badge.className = "px-4 py-1.5 rounded-full text-sm font-black bg-red-100 text-red-600 uppercase tracking-wide border border-red-200";
        badge.innerHTML = `<i class="inline w-4 h-4 mr-1" data-lucide="alert-circle"></i> Payment Overdue`;
        actionArea.innerHTML = `
            <button onclick="handleRenew()" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                <i data-lucide="refresh-cw" class="w-5 h-5"></i> Renew Agreement Now
            </button>`;
    } else {
        badge.className = "px-4 py-1.5 rounded-full text-sm font-black bg-green-100 text-green-600 uppercase tracking-wide border border-green-200";
        badge.innerHTML = `<i class="inline w-4 h-4 mr-1" data-lucide="check-circle-2"></i> Active`;
        actionArea.innerHTML = `
            <button onclick="handleRenew()" class="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                <i data-lucide="history" class="w-5 h-5"></i> Extend Agreement Early
            </button>`;
    }
    if (window.lucide) lucide.createIcons();
}

function renderNoAgreementState() {
    document.getElementById("rentalIdDisplay").textContent = "No Agreement Found";
    document.getElementById("actionArea").innerHTML = `<div class="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm font-medium text-center border border-yellow-100">Contact management to link an agreement.</div>`;
}

//ACTION HANDLERS
window.handleRenew = async () => {
    if (!confirm("Renew agreement for another month?")) return;
    const btn = document.querySelector("#actionArea button");
    const original = btn.innerHTML;
    
    btn.innerHTML = `<i class="animate-spin" data-lucide="loader-2"></i> Processing...`;
    btn.style.pointerEvents = "none";
    if (window.lucide) lucide.createIcons();

    try {
        await updateDoc(doc(db, "rental_agreements", currentAgreementId), {
            dateRenewed: Timestamp.now(),
            status: "renewed" 
        });
        alert("Renewed successfully!");
    } catch (error) {
        alert("Update failed.");
        btn.innerHTML = original;
        btn.style.pointerEvents = "auto";
        if (window.lucide) lucide.createIcons();
    }
};

document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "../vendor_login/vendor-login.html");
});

document.getElementById("editInfoBtn").addEventListener("click", () => {
    if (currentStallId) window.location.href = `../edit_info/edit_info.html?stallId=${currentStallId}`;
});

if (document.getElementById("changePasswordBtn")) {
    document.getElementById("changePasswordBtn").addEventListener("click", () => {
        window.location.href = "../change_password/change_password.html";
    });
}