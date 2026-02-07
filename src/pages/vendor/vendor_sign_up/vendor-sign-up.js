import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let isSigningUp = false;

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user && !isSigningUp) {
        window.location.href = "../create_stall/create-stall.html";
    }
});

const signUpForm = document.getElementById("vendorSignUpForm");

if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("vendorName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const submitBtn = signUpForm.querySelector('button[type="submit"]');

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Securing & Creating...";
        
        isSigningUp = true;

        try {
            // 1. Create User in Firebase Auth (Handles security automatically)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Save Vendor Details to Firestore (NO PASSWORD stored here)
            await setDoc(doc(db, "vendor_list", user.uid), {
                name: name,
                email: email,
                role: "vendor",
                method: "email",
                createdAt: new Date()
            });

            alert("Account created securely! Redirecting to stall setup...");
            window.location.href = "../create_stall/create-stall.html"; 
            
        } catch (error) {
            isSigningUp = false;
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
            console.error("Sign up failed:", error.message);

            if (error.code === 'auth/email-already-in-use') {
                alert("This email is already registered. Please login.");
            } else if (error.code === 'auth/weak-password') {
                alert("Password is too weak.");
            } else {
                alert("Sign up failed: " + error.message);
            }
        }
    });
}