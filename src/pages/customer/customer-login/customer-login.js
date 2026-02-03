import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

async function hashPassword(string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "customer_list", user.uid));

            if (userDoc.exists()) {
                // PATH FIX: Up 1 level to 'customer' folder, then into 'home'
                window.location.href = "../home/home.html";
            } else {
                await setDoc(doc(db, "customer_list", user.uid), {
                    email: user.email,
                    wallet: 0, 
                    createdAt: new Date(),
                    method: "google"
                });
                alert("Account created successfully via Google!");
                // PATH FIX: Up 1 level to 'customer' folder, then into 'home'
                window.location.href = "../home/home.html";
            }
        } catch (error) {
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

        try {
            const hashedInput = await hashPassword(passwordInput);
            const q = query(collection(db, "customer_list"), where("email", "==", emailInput));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                
                if (userData.password === hashedInput) {
                    // PATH FIX: Up 1 level to 'customer' folder, then into 'home'
                    window.location.href = "../home/home.html";
                } else {
                    alert("Incorrect password. Please try again!");
                }
            } else {
                alert("No user found with this email. Please sign up!");
                // PATH FIX: Up 2 levels to 'pages', then into 'customer-sign-up'
                window.location.href = "../../customer-sign-up/customer-sign-up.html";
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed: " + error.message);
        }
    });
}