import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    serverTimestamp 
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
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("createStallForm");
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        alert("Session expired. Please login again.");
        window.location.href = "../vendor_login/vendor-login.html";
    }
});

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUser) return;

        const submitBtn = form.querySelector("button");
        submitBtn.disabled = true;
        submitBtn.innerText = "Registering...";

        const stallName = document.getElementById("stallName").value.trim();
        const hawkerCentre = document.getElementById("hawkerCentre").value.trim();
        const address = document.getElementById("stallAddress").value.trim();
        const cuisine = document.getElementById("cuisineType").value;
        const image = document.getElementById("stallImage").value.trim();

        try {
            // TASK 2: Create Stall Document
            const stallRef = await addDoc(collection(db, "hawker-stalls"), {
                name: stallName,
                hawkerCentre: hawkerCentre,
                address: address,
                cuisineTypes: [cuisine], 
                image: image,
                hearts: 0,
                ownerId: currentUser.uid,
                createdAt: serverTimestamp()
            });

            // TASK 3: Link Stall ID to Vendor
            const vendorRef = doc(db, "vendor_list", currentUser.uid);
            await updateDoc(vendorRef, {
                stallId: stallRef.id
            });

            // TASK 4: Create Rental Agreement with your specific fields
            await addDoc(collection(db, "rental_agreements"), {
                stallId: stallRef.id,
                status: "renewed", // Based on your example
                fee: 1500,        // Based on your example
                image: "https://placehold.co/600x800?text=Rental+Agreement",
                dateCreated: serverTimestamp(),
                dateRenewed: serverTimestamp(),
                // Setting dateEnd to Feb 28, 2027 as per your example
                dateEnd: new Date("2027-02-28T22:21:07") 
            });

            localStorage.setItem("activeStallId", stallRef.id);
            
            alert("Stall and Rental Agreement created successfully!");

            // Redirect to menu setup
            window.location.href = "../menu_arrange/menu_arrange.html";

        } catch (error) {
            console.error("Error during setup:", error);
            alert("Error: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Complete Setup";
        }
    });
}