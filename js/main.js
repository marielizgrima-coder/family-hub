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
 * 3. FETCH WEATHER FROM Open-Metro
 */
async function loadWeather() {
    const weatherElem = document.getElementById("weatherInfo");
    
    // Żurrieq coordinates
    const lat = 35.83;
    const lon = 14.47;
    
    // Open-Meteo URL (completely free, no key)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        
        // Convert weather code to a readable word
        const description = getWeatherDescription(code);

        weatherElem.innerHTML = `${temp}°C • ${description} in Zurrieq`;
    } catch (error) {
        console.error("Weather Error:", error);
        weatherElem.textContent = "Weather currently unavailable.";
    }
}

// Helper function to turn numbers into words
function getWeatherDescription(code) {
    const mapping = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        61: "Slight rain",
        95: "Thunderstorm"
    };
    return mapping[code] || "Clear";
}

// RUN ALL FUNCTIONS ON LOAD
setDate();
loadMotivation();
loadWeather();
