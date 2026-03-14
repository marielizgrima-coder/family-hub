// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBH2reigj2qDYUHMTrCZGXzkdkllt3ej_4",
  authDomain: "family-hub-fd01b.firebaseapp.com",
  projectId: "family-hub-fd01b",
  storageBucket: "family-hub-fd01b.firebasestorage.app",
  messagingSenderId: "472531223034",
  appId: "1:472531223034:web:27467534bf62de74066443",
  measurementId: "G-WQZMLG8W8N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
