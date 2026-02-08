import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456",
  storageBucket: "fed-assignment-f1456.firebasestorage.app",
  messagingSenderId: "646434763443",
  appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const neaIdInput = document.getElementById("neaId").value.trim();
        const passwordInput = document.getElementById("password").value.trim();
        const submitBtn = loginForm.querySelector("button");

        submitBtn.disabled = true;
        submitBtn.innerText = "Verifying...";

        try {
            const q = query(
                collection(db, "nea-officer"), 
                where("ID", "==", neaIdInput),
                where("Password", "==", passwordInput)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const officerData = querySnapshot.docs[0].data();

                localStorage.setItem("neaOfficerName", officerData.Name);
                localStorage.setItem("neaOfficerId", officerData.ID);

                alert(`Welcome back, ${officerData.Name}!`);
                
<<<<<<< HEAD:src/pages/nea_officer/home/log_in/log_in.js
                window.location.href = "../../homepage/home.html";
=======
                // Redirect to Home Page (Up one level to 'home' folder)
                window.location.href = "../homepage/home.html";
>>>>>>> Jaron-nea-home:src/pages/nea_officer/log_in/log_in.js
            } else {
                alert("Invalid NEA ID or Password. Please try again.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Log in";
            }

        } catch (error) {
            console.error("Login Error:", error);
            alert("System Error: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Log in";
        }
    });
}