// js/main.js
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/**
 * 1. SET THE DATE
 * Displays the date in British format (e.g., Sunday, 15 Mar 2026)
 */
function setDate() {
    const dateElem = document.getElementById("currentDate");
    if (dateElem) {
        const today = new Date();
        const options = { weekday: "long", day: "numeric", month: "short", year: "numeric" };
        dateElem.textContent = today.toLocaleDateString("en-GB", options);
    }
}

/**
 * 2. FETCH MOTIVATION FROM FIREBASE
 * Looks for a document in the 'motivation' collection named 'YYYY-MM-DD'
 */
async function loadMotivation() {
    const motivationElem = document.getElementById("motivationText");
    const today = new Date();
    // This creates the ID: "2026-03-15"
    const docId = today.toISOString().split('T')[0]; 

    try {
        const docRef = doc(db, "motivation", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            motivationElem.textContent = docSnap.data().text;
        } else {
            // Default message if no specific quote is set for today
            motivationElem.textContent = "You’ve got this, Marie. One step at a time.";
        }
    } catch (error) {
        console.error("Firebase Error:", error);
        motivationElem.textContent = "Make today amazing!";
    }
}

/**
 * 3. FETCH WEATHER FROM OPENWEATHER
 * Gets real-time weather for Żurrieq
 */
async function loadWeather() {
    const weatherElem = document.getElementById("weatherInfo");
    const apiKey = "YOUR_OPENWEATHER_API_KEY"; // <--- PASTE YOUR KEY HERE
    const lat = 35.83;
    const lon = 14.47;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather API Error");
        
        const data = await response.json();
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        
        // Capitalize first letter of description
        const capitalizedDesc = desc.charAt(0).toUpperCase() + desc.slice(1);
        
        weatherElem.innerHTML = `${temp}°C • ${capitalizedDesc} in ${data.name}`;
    } catch (error) {
        console.error("Weather Error:", error);
        weatherElem.textContent = "Weather currently unavailable.";
    }
}

// RUN ALL FUNCTIONS ON LOAD
setDate();
loadMotivation();
loadWeather();
