import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ADDED YOUR CONFIG HERE
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

const verifyForm = document.getElementById("verifyEmailForm");
if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("verifyEmail").value.trim();

        try {
            // Search Firestore for the email
            const q = query(collection(db, "customer_list"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // SUCCESS: User exists. Save ID and go to change password page.
                localStorage.setItem("resetUserId", querySnapshot.docs[0].id);
                window.location.href = "change-password.html"; 
            } else {
                alert("Account not found. Please check your email.");
            }
        } catch (error) {
            console.error("Verification Error:", error);
            alert("Error: " + error.message);
        }
    });
}