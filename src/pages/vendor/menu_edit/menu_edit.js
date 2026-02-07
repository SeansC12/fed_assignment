import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 1. GET THE ID FROM THE URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get("id");

let currentImageUrl = "";

if (!itemId) { // No ID provided
    alert("No item ID found. Returning to menu.");
    window.location.href = "../menu_arrange/menu_arrange.html";
}

// 2. FETCH EXISTING DATA
const loadData = async () => {
  try {
    const docRef = doc(db, "vendor_menu", itemId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Fill the form fields
      document.getElementById("itemName").value = data.name;
      document.getElementById("itemPrice").value = data.price;
      document.getElementById("itemCategory").value = data.category;
      document.getElementById("itemDesc").value = data.desc;
      document.getElementById("itemStock").value = data.stock.toString();

      // Set image preview
      currentImageUrl = data.image;
      document.getElementById("imagePreview").src = data.image;

      lucide.createIcons();
    } else {
      alert("Item does not exist.");
      window.location.href = "../menu_arrange/menu_arrange.html";
    }
  } catch (error) {
    console.error("Error fetching item:", error);
  }
};

loadData();

// 3. HANDLE IMAGE CHANGES
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      currentImageUrl = reader.result;
      document.getElementById("imagePreview").src = currentImageUrl;
    };
    reader.readAsDataURL(file);
  }
});

// 4. SAVE UPDATES
document.getElementById("updateBtn").addEventListener("click", async () => {
  const btn = document.getElementById("updateBtn");
  btn.disabled = true;
  btn.innerText = "Updating...";

  try {
    const docRef = doc(db, "vendor_menu", itemId);
    await updateDoc(docRef, {
      name: document.getElementById("itemName").value,
      price: parseFloat(document.getElementById("itemPrice").value),
      category: document.getElementById("itemCategory").value,
      desc: document.getElementById("itemDesc").value,
      stock: document.getElementById("itemStock").value === "true",
      image: currentImageUrl,
      updatedAt: new Date(),
    });

    alert("Update successful!");
    window.location.href = "../menu_arrange/menu_arrange.html";
  } catch (error) {
    console.error("Update failed:", error);
    alert("Failed to update item.");
    btn.disabled = false;
    btn.innerText = "Save Changes";
  }
});

lucide.createIcons();
