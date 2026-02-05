import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { setupUserProfilePopup } from "../user-utils.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456",
  storageBucket: "fed-assignment-f1456.firebasestorage.app",
  messagingSenderId: "646434763443",
  appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupUserProfilePopup);
} else {
  setupUserProfilePopup();
}

// 1. Get Stall ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const stallId = urlParams.get("stallId");

// 2. DOM Elements
const form = document.getElementById("complaintForm");
const stallNameDisplay = document.getElementById("stall-name-display");
const backBtn = document.getElementById("back-btn");
const cancelBtn = document.getElementById("cancel-btn");
const submitBtn = document.getElementById("submit-btn");

let currentUser = null;
let currentStallData = null;

// 3. Initialize Page
async function init() {
    if (!stallId) {
        alert("No stall selected. Redirecting to home.");
        window.location.href = "/src/pages/customer/home/home.html";
        return;
    }

    // Check Auth
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await fetchStallInfo();
        } else {
            // Optional: Redirect to login if your app requires login to complain
            // window.location.href = "/src/pages/customer-login/customer-login.html";
            console.log("User not logged in (Anonymous complaint might be allowed depending on rules)");
        }
    });
}

// 4. Fetch Stall Name for Display
async function fetchStallInfo() {
    try {
        const stallDoc = await getDoc(doc(db, "hawker-stalls", stallId));
        if (stallDoc.exists()) {
            currentStallData = stallDoc.data();
            stallNameDisplay.textContent = `Stall: ${currentStallData.name}`;
        } else {
            stallNameDisplay.textContent = "Stall: Unknown";
        }
    } catch (error) {
        console.error("Error fetching stall:", error);
        stallNameDisplay.textContent = "Stall: Error loading name";
    }
}

// 5. Helper: Convert Image to Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// 6. Handle Form Submission
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable button to prevent double submit
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");

    const category = document.getElementById("category").value;
    const message = document.getElementById("message").value;
    const imageFile = document.getElementById("evidence").files[0];

    try {
        let imageBase64 = null;
        if (imageFile) {
            // Basic size check (5MB)
            if (imageFile.size > 5 * 1024 * 1024) {
                throw new Error("Image file is too large. Max 5MB.");
            }
            imageBase64 = await toBase64(imageFile);
        }

        const complaintData = {
            stallId: stallId,
            stallName: currentStallData ? currentStallData.name : "Unknown",
            userId: currentUser ? currentUser.uid : "anonymous",
            userEmail: currentUser ? currentUser.email : "anonymous",
            category: category,
            message: message,
            image: imageBase64, // Storing Base64 string directly (Note: For production, Storage bucket is better)
            status: "Pending", // Default status for admin/vendor to review
            createdAt: new Date().toISOString()
        };

        // Add to 'complaint_list' collection
        await addDoc(collection(db, "complaint_list"), complaintData);

        alert("Complaint filed successfully. Thank you for your feedback.");
        goBackToStall();

    } catch (error) {
        console.error("Error filing complaint:", error);
        alert("Error: " + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Complaint";
        submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
});

// 7. Navigation Helpers
function goBackToStall() {
    window.location.href = `/src/pages/customer/stall/stall-details.html?id=${stallId}`;
}

backBtn.addEventListener("click", goBackToStall);
cancelBtn.addEventListener("click", goBackToStall);

// Run Init
init();
