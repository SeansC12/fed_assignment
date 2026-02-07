import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
let currentStallId = "NkfmlElwOWPU0Mb5L40n"; // Placeholder until we get real stall ID
// Refresh Icons
window.lucide.createIcons();

onAuthStateChanged(auth, async (user) => {
    const displayElement = document.getElementById("displayStallName");
    
    if (user) {
        try {
            // Find the stall where the ownerId matches the logged-in User UID
            const stallsRef = collection(db, "hawker-stalls");
            const q = query(stallsRef, where("ownerId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const stallDoc = querySnapshot.docs[0];
                currentStallId = stallDoc.id;
                displayElement.textContent = stallDoc.data().name;
                console.log("Authenticated for stall:", currentStallId);
            } else {
                displayElement.textContent = "No stall found for this account";
            }
        } catch (e) {
            console.error("Error fetching stall name:", e);
            displayElement.textContent = "Error loading stall";
        }
    } else {
        // No user is signed in, redirect to login
        //window.location.href = "../login/login.html";
        console.log("No user logged in. Defaulting to preview mode.");
    }
});

// --- GET LOGGED IN STALL ---
// Replace 'currentStallId' with the key you use in your login logic

async function loadCurrentStallName() {
    const displayElement = document.getElementById("displayStallName");
    
    if (!currentStallId) {
        displayElement.textContent = "Error: No Stall ID found";
        return;
    }

    try {
        const stallSnap = await getDoc(doc(db, "hawker-stalls", currentStallId));
        if (stallSnap.exists()) {
            // This updates the "Loading..." text to the actual name
            displayElement.textContent = stallSnap.data().name; 
        } else {
            displayElement.textContent = "Unknown Stall";
        }
    } catch (e) {
        console.error("Error fetching stall name:", e);
        displayElement.textContent = "Error loading name";
    }
}

document.getElementById("addPromoForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const selectedCategory = document.getElementById("affected").value;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Processing items...";

    try {
        // 1. Fetch IDs of items in the selected category
        let itemQuery;
        const menuRef = collection(db, "vendor_menu");

        if (selectedCategory === "All") {
            // Get every item for this stall
            itemQuery = query(menuRef, where("stallId", "==", currentStallId));
        } else {
            // Get items matching specific stall AND category
            itemQuery = query(
                menuRef, 
                where("stallId", "==", currentStallId), 
                where("category", "==", selectedCategory)
            );
        }

        const itemSnap = await getDocs(itemQuery);
        
        // 2. Map the results to an array of IDs
        const affectedIds = itemSnap.docs.map(doc => doc.id);

        if (affectedIds.length === 0) {
            const proceed = confirm(`No items found in category "${selectedCategory}". Create promotion anyway?`);
            if (!proceed) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Create Promotion";
                return;
            }
        }

        // 3. Prepare the Promotion Object
        const newPromo = {
            name: document.getElementById("promoName").value,
            description: document.getElementById("promoDesc").value,
            stallid: currentStallId,
            discount: document.getElementById("promoDiscount").value,
            affected: selectedCategory, // The label (e.g., "Mains")
            affectedId: affectedIds,     // The list of actual item IDs
            dateStart: Timestamp.fromDate(new Date(document.getElementById("dateStart").value)),
            dateEnd: Timestamp.fromDate(new Date(document.getElementById("dateEnd").value)),
            createdAt: Timestamp.now()
        };

        // 4. Save to Firestore
        await addDoc(collection(db, "promotions"), newPromo);
        
        alert(`Success! Promotion applied to ${affectedIds.length} items.`);
        window.location.href = "../promotions/promotions.html";

    } catch (error) {
        console.error("Error creating promotion:", error);
        alert("Failed to create promotion. Check console.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Create Promotion";
    }
});

// Initial Load
loadCurrentStallName();