import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
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

// --- 1. FORGOT PASSWORD REDIRECT ---
// Redirects to your new verification page instead of sending an email
const forgotPasswordLink = document.getElementById("forgotPassword");
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = "verify-email.html";
    });
}

// --- 2. GOOGLE LOGIN (WITH AUTO-SIGNUP) ---
const googleBtn = document.getElementById("googleLogin");
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, "customer_list", user.uid));

            if (userDoc.exists()) {
                // User already exists, log them in
                window.location.href = "../customer/home/home.html";
            } else {
                // New user: Create profile automatically
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
            console.error("Google Login Error:", error.message);
            alert("Error: " + error.message);
        }
    });
}

// --- 3. MANUAL LOGIN (CHECKS FIRESTORE PASSWORD) ---
const loginForm = document.getElementById("customerLoginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("email").value.trim();
        const passwordInput = document.getElementById("password").value;

        try {
            // Search for the user by email in the Firestore collection
            const q = query(collection(db, "customer_list"), where("email", "==", emailInput));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                
                // Compare entered password with the 'password' field in Firestore
                if (userData.password === passwordInput) {
                    // Success! Redirect to home
                    window.location.href = "../customer/home/home.html";
                } else {
                    alert("Incorrect password. Please try again!");
                }
            } else {
                alert("No user found with this email. Please sign up!");
                window.location.href = "../customer-sign-up/customer-sign-up.html";
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed: " + error.message);
        }
    });
}