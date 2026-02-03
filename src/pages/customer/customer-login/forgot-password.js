import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Use your same Firebase Config
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

const resetForm = document.getElementById("resetPasswordForm");

if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("resetEmail").value;

        try {
            await sendPasswordResetEmail(auth, email);
            alert("Verification successful! An email has been sent to " + email + ". Please follow the link in the email to change your password.");
            // Redirect back to login after success
            window.location.href = "customer-login.html";
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                alert("This email is not registered in our system.");
            } else {
                alert("Error: " + error.message);
            }
        }
    });
}