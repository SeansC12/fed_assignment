import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// --- ADDED: HASHING FUNCTION ---
async function hashPassword(string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const changeForm = document.getElementById("changePasswordForm");

if (changeForm) {
    changeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPass = document.getElementById("newPass").value;
        const confirmPass = document.getElementById("confirmPass").value;
        const userId = localStorage.getItem("resetUserId");

        if (!userId) {
            alert("Session expired. Please verify your email again.");
            window.location.href = "verify-email.html";
            return;
        }

        if (newPass !== confirmPass) {
            alert("Passwords do not match!");
            return;
        }

        try {
            // 1. Hash the NEW password before saving
            const hashedPassword = await hashPassword(newPass);

            // 2. Update Firestore with the HASH, not the plain text
            const userRef = doc(db, "vendor_list", userId);
            await updateDoc(userRef, { password: hashedPassword });
            
            localStorage.removeItem("resetUserId");
            
            alert("Password updated successfully!");
            window.location.href = "vendor-login.html"; // Redirect to login
            
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update password: " + error.message);
        }
    });
}