import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const signUpForm = document.getElementById("vendorSignUpForm");

if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("vendorName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const stallCode = document.getElementById("stallCode").value.trim();
        const submitBtn = signUpForm.querySelector('button[type="submit"]');

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Verifying Stall...";

        try {
            // 1. Verify Stall Code (NkfmlElwOWPU0Mb5L40n)
            const stallRef = doc(db, "hawker-stalls", stallCode);
            const stallSnap = await getDoc(stallRef);

            if (!stallSnap.exists()) {
                throw new Error("Invalid Stall Verification Code. Access Denied.");
            }

            submitBtn.innerText = "Creating Account...";

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Save to vendor_list
            await setDoc(doc(db, "vendor_list", user.uid), {
                name: name,
                email: email,
                password: password, 
                stallId: stallCode, 
                createdAt: new Date(),
                role: "vendor",
                method: "email"
            });

            // 4. Save Session
            localStorage.setItem("activeStallId", stallCode);

            alert("Vendor account created successfully!");
            
            // PATH FIX: Redirect to sibling folder 'home'
            window.location.href = "../home/home.html"; 
            
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
            console.error("Sign up failed:", error.message);
            alert("Sign up failed: " + error.message);
        }
    });
}