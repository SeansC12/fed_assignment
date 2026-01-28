import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
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
const provider = new GoogleAuthProvider();

// --- GOOGLE LOGIN LOGIC ---
const googleBtn = document.getElementById("googleLogin");

if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, "customer_list", user.uid));

            if (userDoc.exists()) {
                // User found, proceed to home
                window.location.href = "../customer/home/home.html";
            } else {
                // Auto-create profile for first-time Google users
                await setDoc(doc(db, "customer_list", user.uid), {
                    email: user.email,
                    wallet: 0, 
                    createdAt: new Date(),
                    method: "google"
                });
                alert("Account created successfully via Google!");
                window.location.href = "../customer/home/home.html";
            }
        } catch (error) {
            console.error("Login Error:", error.message);
            alert("Error: " + error.message);
        }
    });
}

// --- MANUAL EMAIL LOGIN LOGIC ---
const loginForm = document.getElementById("customerLoginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            // Attempt to sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Verify they exist in your 'customer_list' collection
            const userDoc = await getDoc(doc(db, "customer_list", user.uid));

            if (userDoc.exists()) {
                window.location.href = "../customer/home/home.html";
            } else {
                // This handles cases where Auth exists but Firestore record is missing
                await signOut(auth);
                alert("No user found. Please sign up first!");
                window.location.href = "../customer-sign-up/customer-sign-up.html";
            }
        } catch (error) {
            // Handle specific "Not Found" errors
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                alert("No user found. Please sign up!");
                window.location.href = "../customer-sign-up/customer-sign-up.html";
            } else {
                alert("Login failed: " + error.message);
            }
        }
    });
}