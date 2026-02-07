import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

let isSigningIn = false;

onAuthStateChanged(auth, (user) => {
    if (user && !isSigningIn) {
        window.location.href = "../home/home.html";
    }
});

const forgotPasswordLink = document.getElementById("forgotPassword");
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = "verify-email.html";
    });
}

const googleBtn = document.getElementById("googleLogin");
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            isSigningIn = true;
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "customer_list", user.uid));

            if (userDoc.exists()) {
                window.location.href = "../home/home.html";
            } else {
                await setDoc(doc(db, "customer_list", user.uid), {
                    email: user.email,
                    wallet: 0, 
                    createdAt: new Date(),
                    method: "google"
                });
                alert("Account created successfully via Google!");

                window.location.href = "../home/home.html";
            }
        } catch (error) {
            isSigningIn = false;
            console.error("Google Login Error:", error.message);
            alert("Error: " + error.message);
        }
    });
}

const loginForm = document.getElementById("customerLoginForm");
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

            const userDoc = await getDoc(doc(db, "customer_list", user.uid));
            
            if (!userDoc.exists()) {
                console.warn("User exists in Auth but not in Firestore. Creating document...");
                await setDoc(doc(db, "customer_list", user.uid), {
                    email: user.email,
                    wallet: 0,
                    createdAt: new Date(),
                    method: "email"
                });
            }

            window.location.href = "../home/home.html";
            
        } catch (error) {
            isSigningIn = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Login";
            }
            
            console.error("Login Error:", error);
            
            if (error.code === 'auth/user-not-found') {
                alert("No account found with this email. Please sign up!");
                window.location.href = "../../customer-sign-up/customer-sign-up.html";
            } else if (error.code === 'auth/wrong-password') {
                alert("Incorrect password. Please try again!");
            } else if (error.code === 'auth/invalid-email') {
                alert("Invalid email address format.");
            } else if (error.code === 'auth/invalid-credential') {
                alert("Invalid email or password. Please try again!");
            } else {
                alert("Login failed: " + error.message);
            }
        }
    });
}
