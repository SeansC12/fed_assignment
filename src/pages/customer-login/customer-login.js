import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const googleBtn = document.getElementById("googleLogin");

if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in the 'customer_list' collection
            const userDoc = await getDoc(doc(db, "customer_list", user.uid));

            if (userDoc.exists()) {
                // SUCCESS: Redirect to teammate's home page folder
                window.location.href = "../customer/home/home.html";
            } else {
                // NEW USER: Automatically create their profile
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

// Block the manual email form on the LOGIN page only
const loginForm = document.getElementById("customerLoginForm");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Email login is currently under maintenance. Please use Google Login!");
    });
}