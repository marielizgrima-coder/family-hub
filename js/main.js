import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    // ... add the rest of your config from Firebase Console
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Date Handler
const today = new Date();
document.getElementById("currentDate").textContent = today.toLocaleDateString("en-GB", { 
    weekday: "long", day: "numeric", month: "short", year: "numeric" 
});

// 3. Motivation from Firebase
async function loadMotivation() {
    const motivationElem = document.getElementById("motivationText");
    const isoDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    try {
        const docRef = doc(db, "motivation", isoDate);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            motivationElem.textContent = docSnap.data().text;
        } else {
            motivationElem.textContent = "You've got this, Marie!";
        }
    } catch (error) {
        console.error("Firebase Error:", error);
    }
}

// 4. Weather from OpenWeather
async function loadWeather() {
    const weatherElem = document.getElementById("weatherInfo");
    const apiKey = "YOUR_OPEN_WEATHER_API_KEY";
    // Using Żurrieq coordinates: lat=35.83, lon=14.47
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=35.83&lon=14.47&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        const city = data.name;

        weatherElem.innerHTML = `${temp}°C • ${desc.charAt(0).toUpperCase() + desc.slice(1)} in ${city}`;
    } catch (error) {
        weatherElem.textContent = "Weather currently unavailable.";
    }
}

// Initialize Everything
loadMotivation();
loadWeather();
