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

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is already logged in, redirect to home
        window.location.href = "../home/home.html";
    }
});

const signUpForm = document.getElementById("customerSignUpForm");

if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const submitBtn = signUpForm.querySelector('button[type="submit"]');

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Account...";

        try {
            // 1. Create user in Firebase Auth (Auth handles password hashing)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create record in Firestore customer_list (no password needed - Auth handles it)
            await setDoc(doc(db, "customer_list", user.uid), {
                email: email,
                wallet: 0, 
                createdAt: new Date(),
                method: "email"
            });

            // 3. Set cookie for compatibility
            document.cookie = `customerId=${user.uid}; path=/; max-age=${400 * 24 * 60 * 60}`;

            alert("Account created successfully!");
            
            // 4. Redirect to home page
            window.location.href = "../home/home.html";
            
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
            console.error("Sign up failed:", error.message);
            
            // Provide user-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                alert("This email is already registered. Please login instead.");
            } else if (error.code === 'auth/invalid-email') {
                alert("Invalid email address format.");
            } else if (error.code === 'auth/weak-password') {
                alert("Password is too weak. Please use a stronger password.");
            } else {
                alert("Sign up failed: " + error.message);
            }
        }
    });
}