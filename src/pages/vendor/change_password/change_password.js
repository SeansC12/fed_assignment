import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
    authDomain: "fed-assignment-f1456.firebaseapp.com",
    projectId: "fed-assignment-f1456",
    storageBucket: "fed-assignment-f1456.firebasestorage.app",
    messagingSenderId: "646434763443",
    appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Icons
if (window.lucide) lucide.createIcons();

// Ensure user is logged in
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login/login.html";
    }
});

const form = document.getElementById("passwordForm");
const errorBox = document.getElementById("errorMessage");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const currentPass = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;

    // 1. Validation
    if (newPass !== confirmPass) {
        showError("New passwords do not match.");
        return;
    }

    if (newPass.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    // 2. Loading State
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="animate-spin" data-lucide="loader-2"></i> Updating...`;
    lucide.createIcons();

    try {
        const user = auth.currentUser;

        // 3. Re-authenticate User
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);

        // 4. Update Password
        await updatePassword(user, newPass);

        // 5. Success
        alert("Password updated successfully!");
        window.location.href = "../account/account.html";

    } catch (error) {
        console.error("Update Error:", error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            showError("The current password you entered is incorrect.");
        } else if (error.code === 'auth/weak-password') {
            showError("Password is too weak. Try adding numbers or symbols.");
        } else if (error.code === 'auth/requires-recent-login') {
            showError("Session expired. Please log out and log in again.");
        } else {
            showError("Failed to update password. Please try again.");
        }

        // Reset Button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        lucide.createIcons();
    }
});

function showError(msg) {
    errorBox.querySelector("span").textContent = msg;
    errorBox.classList.remove("hidden");
}

function hideError() {
    errorBox.classList.add("hidden");
}

//PASSWORD VISIBILITY TOGGLE LOGIC
const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Get the target input ID from the data-target attribute
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        const icon = button.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            icon.setAttribute("data-lucide", "eye-off");
        } else {
            input.type = "password";
            icon.setAttribute("data-lucide", "eye");
        }

        // Re-render only the icons inside this specific button
        lucide.createIcons();
    });
});