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
            // TARGET VENDOR_LIST
            const userRef = doc(db, "vendor_list", userId);
            await updateDoc(userRef, { password: newPass });
            
            localStorage.removeItem("resetUserId");
            window.location.href = "reset-success.html"; 
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update password: " + error.message);
        }
    });
}