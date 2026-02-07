import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc, 
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
let base64String = "";

// Get Stall ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const targetStallId = urlParams.get('stallId');

// Initialize Icons
if (window.lucide) lucide.createIcons();

// --- LOAD DATA ---
onAuthStateChanged(auth, async (user) => {
    try {
        const stallRef = doc(db, "hawker-stalls", targetStallId);
        const stallSnap = await getDoc(stallRef);

        if (stallSnap.exists()) {
            const data = stallSnap.data();
            
            // Security Check
            if (data.ownerId !== user.uid) {
                window.location.href = "../account/account.html";
                return;
            }

            // Populate Fields
            document.getElementById("stallName").value = data.name || "";
            document.getElementById("stallLocation").value = data.address || "";

            // Handle the image display
            if (data.image) {
                const preview = document.getElementById("imagePreview");
                const previewContainer = document.getElementById("imagePreviewContainer");
                
                if (preview && previewContainer) {
                    preview.src = data.image; // Set the saved Base64 or URL to the preview img
                    previewContainer.classList.remove("hidden");
                }
            }

            document.getElementById("loadingOverlay").style.display = "none";
        }
    } catch (error) {
        console.error("Error loading stall:", error);
    }
});

const fileInput = document.getElementById("stallImageInput");
const preview = document.getElementById("imagePreview");
const previewContainer = document.getElementById("imagePreviewContainer");

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file.size > 512000) { 
        alert("File is too large! Please choose an image under 500KB.");
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        base64String = reader.result;
        preview.src = base64String;
        previewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
});

document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById("saveBtn");
    const originalText = saveBtn.innerHTML;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="animate-spin" data-lucide="loader-2"></i> Saving...`;
    if (window.lucide) lucide.createIcons();

    const selectedCuisine = document.getElementById("cuisineType").value;

    const updatedData = {
        name: document.getElementById("stallName").value,
        address: document.getElementById("stallLocation").value,
        cuisineTypes: [selectedCuisine], 
        lastUpdated: Timestamp.now()
    };

    if (base64String) {
        updatedData.image = base64String;
    }

    try {
        const stallRef = doc(db, "hawker-stalls", targetStallId);
        await updateDoc(stallRef, updatedData);
        
        alert("Stall information updated successfully!");
        window.location.href = "../account/account.html";
    } catch (error) {
        console.error("Update failed:", error);
        alert("Error saving changes.");
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
    }
});

// Cancel Button
document.getElementById("cancelBtn").addEventListener("click", () => {
    window.history.back();
});