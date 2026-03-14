import { db } from './firebase-config.js'; // Your initialized Firebase file
import { doc, getDoc } from "firebase/firestore";

// 1. Get Today's Date for Display (UK Format)
const dateElem = document.getElementById("currentDate");
const today = new Date();
dateElem.textContent = today.toLocaleDateString("en-GB", { 
    weekday: "long", day: "numeric", month: "short", year: "numeric" 
});

// 2. Fetch Motivation from Firestore
async function loadMotivation() {
    const isoDate = today.toISOString().split('T')[0]; // Gets "2026-03-14"
    const docRef = doc(db, "motivation", isoDate);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        document.getElementById("motivationText").innerText = docSnap.data().text;
    }
}

// 3. Fetch Weather (Example using OpenWeather)
async function loadWeather() {
    const apiKey = "YOUR_WEATHER_API_KEY";
    const city = "Zurrieq"; 
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    const data = await response.json();
    
    document.getElementById("weatherInfo").innerText = 
        `${Math.round(data.main.temp)}°C - ${data.weather[0].main} in ${data.name}`;
}

loadMotivation();
loadWeather();
