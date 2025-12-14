// Firebase SDK v9 - Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAUTVcBVXvytDJQ6CUX82VcS7L6WmviJQ",
  authDomain: "web-asesmen.firebaseapp.com",
  projectId: "web-asesmen",
  storageBucket: "web-asesmen.firebasestorage.app",
  messagingSenderId: "228158714492",
  appId: "1:228158714492:web:eb9a248c1acba82c400ff9",
  measurementId: "G-WC2L2230KJ"
  // Hapus databaseURL karena kita pakai Firestore
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);  // Untuk Firestore