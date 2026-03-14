// Add this to the very top of js/main.js
alert("Main.js is connected!");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
// ... the rest of your code

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 1. Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBH2reigj2qDYUHMTrCZGXzkdkllt3ej_4",
    authDomain: "family-hub-fd01b.firebaseapp.com",
    projectId: "family-hub-fd01b",
    storageBucket: "family-hub-fd01b.firebasestorage.app",
    messagingSenderId: "472531223034",
    appId: "1:472531223034:web:27467534bf62de74066443"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Run immediately on load
async function initDashboard() {
    const today = new Date();
    
    // --- DATE ---
    const dateElem = document.getElementById("currentDate");
    if (dateElem) {
        dateElem.textContent = today.toLocaleDateString("en-GB", { 
            weekday: "long", day: "numeric", month: "short", year: "numeric" 
        });
    }

    // --- MOTIVATION ---
    const motivationElem = document.getElementById("motivationText");
    const docId = today.toISOString().split('T')[0]; // "2026-03-15"

    try {
        const docRef = doc(db, "motivation", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            motivationElem.textContent = docSnap.data().text;
        } else {
            motivationElem.textContent = "You've got this, Marie!";
        }
    } catch (e) {
        console.error("Firebase Error:", e);
        motivationElem.textContent = "Believe in yourself today.";
    }

    // --- WEATHER (FREE - NO KEY NEEDED) ---
    async function loadWeather() {
    const weatherElem = document.getElementById("weatherInfo");
    // No key needed for Open-Meteo!
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.83&longitude=14.47&current_weather=true");
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        weatherElem.innerHTML = `${temp}°C • Sunny in Zurrieq`;
    } catch (e) {
        weatherElem.textContent = "Weather unavailable.";
    }
}
    }
}

initDashboard();
