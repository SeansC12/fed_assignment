import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
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
const db = getFirestore(app);
const menuCol = collection(db, "vendor_menu");
const auth = getAuth(app);

// --- STALL ID LOGIC ---
let stallId = "NkfmlElwOWPU0Mb5L40n"; // Placeholder until we get real stall ID
let encodedImage = "https://placehold.co/600x600?text=No+Image+Selected";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Find the stall owned by this specific user
    const stallsRef = collection(db, "hawker-stalls");
    const q = query(stallsRef, where("ownerId", "==", user.uid));
    const snap = await getDocs(q);

    if (!snap.empty) {
      stallId = snap.docs[0].id;
      console.log("Authenticated stall found:", stallId);
    } else {
      console.warn("User logged in but no stall found. Using placeholder.");
      stallId = "NkfmlElwOWPU0Mb5L40n";
    }
  } else {
    // Redirect to login if not authenticated
    console.log("No user logged in. Defaulting to preview mode.");
    //window.location.href = "../login/login.html";
  }
});

// Preview logic
// Attached to window because HTML onclick/onchange needs to see it
window.previewImage = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    encodedImage = reader.result;
    document.getElementById("imagePreview").src = encodedImage;
  };
  reader.readAsDataURL(file);
};

// Submit logic
// Attached to window because HTML onclick needs to see it
window.handleSubmit = async () => {
  const name = document.getElementById("itemName").value;
  const priceInput = document.getElementById("itemPrice").value;

  if (!name || !priceInput) {
    alert("Please enter at least a name and price!");
    return;
  }

  const isConfirmed = confirm(`Add "${name}" to your cloud menu?`);

  if (isConfirmed) {
    try {
      const priceNumber = parseFloat(priceInput);

      await addDoc(menuCol, {
        stallId: stallId,
        name: name,
        price: priceNumber,
        category: document.getElementById("itemCategory").value,
        desc: document.getElementById("itemDesc").value,
        image: encodedImage,
        stock: true,
        createdAt: new Date(),
      });

      window.location.href = "../menu_arrange/menu_arrange.html";
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save to database.");
    }
  }
};

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  } else {
    // If not loaded yet, check again in 50ms
    setTimeout(initIcons, 50);
  }
}

// Call it immediately
initIcons();

// Also make these functions globally available since we are in a module
window.previewImage = window.previewImage || previewImage;
window.handleSubmit = window.handleSubmit || handleSubmit;