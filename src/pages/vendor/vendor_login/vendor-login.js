import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let isSigningIn = false;

onAuthStateChanged(auth, async (user) => {
    if (user && !isSigningIn) {
    }
});

const forgotPasswordLink = document.getElementById("forgotPassword");
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = "verify-email.html";
    });
}

const loginForm = document.getElementById("vendorLoginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("email").value.trim();
        const passwordInput = document.getElementById("password").value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Logging in...";
        }
        
        isSigningIn = true;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
            const user = userCredential.user;

            const userDocRef = doc(db, "vendor_list", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                if(userData.stallId) {
                    localStorage.setItem("activeStallId", userData.stallId);
                }

                window.location.href = "../menu_arrange/menu_arrange.html";
            } else {
                alert("Vendor profile not found. Please sign up.");
                window.location.href = "../vendor_sign_up/vendor-sign-up.html";
            }

        } catch (error) {
            isSigningIn = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Login";
            }
            console.error("Login Error:", error);
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                alert("Invalid email or password.");
            } else if (error.code === 'auth/wrong-password') {
                alert("Invalid email or password.");
            } else if (error.code === 'auth/invalid-email') {
                alert("Invalid email format.");
            } else {
                alert("Login failed: " + error.message);
            }
        }
    });
}