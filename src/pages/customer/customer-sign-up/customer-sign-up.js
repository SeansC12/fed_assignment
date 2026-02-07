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

onAuthStateChanged(auth, (user) => {
    if (user && !isSigningUp) {
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
        isSigningUp = true;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "customer_list", user.uid), {
                email: email,
                password: password,
                wallet: 0, 
                createdAt: new Date(),
                method: "email"
            });

            alert("Account created successfully!");
            isSigningUp = false;
            window.location.href = "../home/home.html";
            
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
            isSigningUp = false;
            
            if (error.code === 'auth/email-already-in-use') {
                alert("This email is already registered. Please login instead.");
            } else {
                alert("Sign up failed: " + error.message);
            }
        }
    });
}