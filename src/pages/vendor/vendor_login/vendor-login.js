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

// --- HELPER: HASHING FUNCTION (Must match Sign Up) ---
async function hashPassword(string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 1. FORGOT PASSWORD
const forgotPasswordLink = document.getElementById("forgotPassword");
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = "verify-email.html";
    });
}

// 2. GOOGLE LOGIN
const googleBtn = document.getElementById("googleLogin");
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "vendor_list", user.uid));

            if (userDoc.exists()) {
                window.location.href = "../home/home.html";
            } else {
                await setDoc(doc(db, "vendor_list", user.uid), {
                    email: user.email,
                    name: user.displayName,
                    createdAt: new Date(),
                    method: "google",
                    role: "vendor"
                });
                alert("Vendor account created via Google! Please contact admin to link your Stall ID.");
                window.location.href = "../home/home.html";
            }
        } catch (error) {
            console.error("Google Login Error:", error.message);
            alert("Error: " + error.message);
        }
    });
}

// 3. MANUAL LOGIN (UPDATED WITH HASHING)
const loginForm = document.getElementById("vendorLoginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("email").value.trim();
        const passwordInput = document.getElementById("password").value;

        try {
            // Hash the entered password to match the database format
            const hashedInput = await hashPassword(passwordInput);

            const q = query(collection(db, "vendor_list"), where("email", "==", emailInput));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                
                // Compare HASH vs HASH
                if (userData.password === hashedInput) {
                    if(userData.stallId) {
                        localStorage.setItem("activeStallId", userData.stallId);
                    }
                    window.location.href = "../home/home.html";
                } else {
                    alert("Incorrect password. Please try again!");
                }
            } else {
                alert("No vendor found with this email. Please sign up!");
                window.location.href = "../vendor_sign_up/vendor-sign-up.html";
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed: " + error.message);
        }
    });
}