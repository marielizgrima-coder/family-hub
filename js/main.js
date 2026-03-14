// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 1. Firebase Config (Only one initialization allowed)
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

// Weather condition helper
function getWeatherDescription(code) {
    const mapping = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 61: "Slight Rain", 80: "Rain Showers", 95: "Thunderstorm"
    };
    return mapping[code] || "Clear";
}

async function initDashboard() {
    const today = new Date();
    
    // --- 1. SET THE DATE ---
    const dateElem = document.getElementById("currentDate");
    if (dateElem) {
        dateElem.textContent = today.toLocaleDateString("en-GB", { 
            weekday: "long", day: "numeric", month: "short", year: "numeric" 
        });
    }

    // --- 2. GET MOTIVATION FROM FIREBASE ---
    const motivationElem = document.getElementById("motivationText");
    const docId = today.toISOString().split('T')[0]; // Creates "2026-03-15"

    try {
        const docRef = doc(db, "motivation", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            motivationElem.textContent = docSnap.data().text;
        } else {
            // Fallback if the document name in Firebase isn't exactly "2026-03-15"
            motivationElem.textContent = "You've got this, Marie! Today is a new day.";
        }
    } catch (e) {
        console.error("Firebase Error:", e);
        motivationElem.textContent = "Make it a great day!";
    }

    // --- 3. GET WEATHER (FREE) ---
    const weatherElem = document.getElementById("weatherInfo");
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.83&longitude=14.47&current_weather=true");
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const condition = getWeatherDescription(data.current_weather.weathercode);
        
        weatherElem.innerHTML = `${temp}°C • ${condition} in Zurrieq`;
    } catch (e) {
        console.error("Weather Error:", e);
        weatherElem.textContent = "Weather currently unavailable.";
    }
}

// Run the function
initDashboard();
