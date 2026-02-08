import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= DOM ================= */
const stallIdEl = document.getElementById("stall-id");
const stallNameEl = document.getElementById("stall-name");
const stallHawkerEl = document.getElementById("stall-hawker");
const remarksEl = document.getElementById("remarks");

const imageInputEl = document.getElementById("imageUpload");
const imageCountEl = document.getElementById("image-count");

const officerNameEl = document.getElementById("officer-name");
const officerInitialsEl = document.getElementById("officer-initials");

/* ================= LOGIN DATA ================= */
const officerName = localStorage.getItem("neaOfficerName");
const officerId = localStorage.getItem("neaOfficerId");

// Must be logged in
if (!officerName || !officerId) {
  window.location.href = "../../nea_officer/login.html";
}

/* ================= STALL ================= */
const stallId = localStorage.getItem("selectedStallId");
if (!stallId) {
  alert("No stall selected.");
}

/* ================= NAVBAR ================= */
officerNameEl.textContent = officerName;
officerInitialsEl.textContent = officerName
  .split(" ")
  .map(word => word[0])
  .join("")
  .toUpperCase();

/* ================= IMAGE HANDLING ================= */
let base64Images = [];

imageInputEl.addEventListener("change", async () => {
  const files = Array.from(imageInputEl.files);
  base64Images = [];

  for (const file of files) {
    const base64 = await fileToBase64(file);
    base64Images.push(base64);
  }

  imageCountEl.textContent = `${base64Images.length} image(s) selected`;
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ================= LOAD STALL ================= */
async function loadStallInfo() {
  const snap = await getDoc(doc(db, "hawker-stalls", stallId));
  if (!snap.exists()) {
    alert("Stall not found.");
    return;
  }

  const stall = snap.data();
  stallIdEl.textContent = stallId;
  stallNameEl.textContent = stall.name || "--";
  stallHawkerEl.textContent = stall.hawkerCentre || "--";
}

/* ================= SUBMIT INSPECTION ================= */
window.submitInspection = async function () {
  const grade = document.querySelector('input[name="grade"]:checked')?.value;
  const remarks = remarksEl.value.trim();

  if (!grade) {
    alert("Please select a grade.");
    return;
  }

  if (!remarks) {
    alert("Please enter remarks.");
    return;
  }

  // Current inspection (overwrite)
  await setDoc(doc(db, "inspections", stallId), {
    hygieneGrade: grade,
    remarks,
    images: base64Images,
    officerName,
    officerId,
    updatedAt: serverTimestamp()
  });

  // History record (append)
  await addDoc(collection(db, "inspections", stallId, "history"), {
    grade,
    remarks,
    images: base64Images,
    officerName,
    officerId,
    inspectedAt: serverTimestamp()
  });

  alert("Inspection submitted successfully.");

  // Reset form
  remarksEl.value = "";
  imageInputEl.value = "";
  imageCountEl.textContent = "0 image(s) selected";
  base64Images = [];

  document
    .querySelectorAll('input[name="grade"]')
    .forEach(radio => (radio.checked = false));
};

/* ================= INIT ================= */
loadStallInfo();
