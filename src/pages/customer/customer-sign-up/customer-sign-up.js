import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

const signUpForm = document.getElementById("customerSignUpForm");

// --- HELPER: HASHING FUNCTION (SHA-256) ---
async function hashPassword(string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

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
        submitBtn.innerText = "Securing Account...";

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Hash the password for database storage
            const hashedPassword = await hashPassword(password);

            // 3. Create record in Firestore customer_list
            await setDoc(doc(db, "customer_list", user.uid), {
                email: email,
                password: hashedPassword, // Storing the Hash
                wallet: 0, 
                createdAt: new Date(),
                method: "email"
            });

            alert("Account created successfully!");
            // Redirect to home page (Sibling folder in 'customer')
            window.location.href = "../home/home.html"; 
            
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
            console.error("Sign up failed:", error.message);
            alert("Sign up failed: " + error.message);
        }
    });
}