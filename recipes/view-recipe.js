/* ---------------------------------------------------------
   VIEW RECIPE PAGE – CLEAN + FIXED
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    loadRecipe();
    setupScreenAwakeToggle();
});

/* ---------------------------------------------------------
   GET RECIPE ID
--------------------------------------------------------- */
function getRecipeId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

/* ---------------------------------------------------------
   LOAD RECIPE
--------------------------------------------------------- */
function loadRecipe() {
    const recipeId = getRecipeId();
    if (!recipeId) {
        alert("No recipe ID found.");
        window.location.href = "recipes.html";
        return;
    }

    // FIXED: correct function name
    const recipe = StorageService.getRecipe(recipeId);
    if (!recipe) {
        alert("Recipe not found.");
        window.location.href = "recipes.html";
        return;
    }

    /* ------------------------------
       BASIC FIELDS
    ------------------------------ */
    document.getElementById("recipeTitle").textContent = recipe.title || "Untitled";

    /* ------------------------------
       TAGS
    ------------------------------ */
    const tagContainer = document.getElementById("recipeTags");
    tagContainer.innerHTML = "";
    (recipe.tags || []).forEach(tag => {
        const pill = document.createElement("span");
        pill.classList.add("tag-pill");
        pill.textContent = tag;
        tagContainer.appendChild(pill);
    });

    /* ------------------------------
       INGREDIENTS (with fractions)
    ------------------------------ */
    renderIngredients(recipe.ingredients || []);

    /* ------------------------------
       COOKING INFO
    ------------------------------ */
    document.getElementById("cookingTime").textContent = formatTime(recipe.cookingTime) || "—";
    document.getElementById("ovenTemp").textContent = formatTemp(recipe.ovenTemp) || "—";
    document.getElementById("servings").textContent = recipe.servings || "—";

    /* ------------------------------
       INSTRUCTIONS
    ------------------------------ */
    document.getElementById("instructionsText").textContent =
        recipe.instructions || "No instructions provided.";
}

/* ---------------------------------------------------------
   EDIT BUTTON
--------------------------------------------------------- */
function editRecipe() {
    const recipeId = getRecipeId();
    window.location.href = `edit-recipe.html?id=${recipeId}`;
}

/* ---------------------------------------------------------
   TIME + TEMP FORMATTERS
--------------------------------------------------------- */
function formatTime(minutes) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) return "";

    if (mins < 60) return `${mins} mins`;

    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;

    if (remaining === 0) return `${hours} hr`;
    return `${hours} hr ${remaining} mins`;
}

function formatTemp(temp) {
    if (!temp && temp !== 0) return "";
    return `${temp}°C`;
}

/* ---------------------------------------------------------
   FRACTION DISPLAY
--------------------------------------------------------- */
const fractionUnitsView = ["cup", "tsp", "tbsp", "piece", "item", "whole"];

const FRACTIONS_F3_VIEW = [
    { dec: 0.125, label: "⅛" },
    { dec: 0.25,  label: "¼" },
    { dec: 0.333, label: "⅓" },
    { dec: 0.375, label: "⅜" },
    { dec: 0.5,   label: "½" },
    { dec: 0.625, label: "⅝" },
    { dec: 0.666, label: "⅔" },
    { dec: 0.75,  label: "¾" },
    { dec: 0.875, label: "⅞" }
];

function toFractionDisplay(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    const whole = Math.floor(num);
    const decimal = num - whole;

    if (decimal < 0.05) return whole.toString();

    let best = null;
    let bestDiff = Infinity;

    FRACTIONS_F3_VIEW.forEach(f => {
        const diff = Math.abs(decimal - f.dec);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = f;
        }
    });

    if (!best || bestDiff > 0.06) return num.toString();

    if (whole === 0) return best.label;
    return `${whole} ${best.label}`;
}

function formatAmount(amount, unit) {
    if (amount == null || amount === "") return "";
    if (fractionUnitsView.includes(unit)) {
        return toFractionDisplay(amount);
    }
    return amount.toString();
}

/* ---------------------------------------------------------
   RENDER INGREDIENTS
--------------------------------------------------------- */
function renderIngredients(ingredients) {
    const list = document.getElementById("ingredientsList");
    if (!list) return;

    list.innerHTML = "";

    if (!ingredients.length) {
        list.innerHTML = "<li>No ingredients listed.</li>";
        return;
    }

    ingredients.forEach(ing => {
        const li = document.createElement("li");
        const amountText = formatAmount(ing.amount, ing.unit);
        const unitText = ing.unit || "";
        const nameText = ing.name || "";

        li.textContent = `${amountText ? amountText + " " : ""}${unitText ? unitText + " " : ""}${nameText}`;
        list.appendChild(li);
    });
}

/* ---------------------------------------------------------
   SCREEN AWAKE BUTTON
--------------------------------------------------------- */
let wakeLock = null;
let screenAwakeOn = false;

async function requestWakeLock() {
    try {
        if ("wakeLock" in navigator) {
            wakeLock = await navigator.wakeLock.request("screen");
            wakeLock.addEventListener("release", () => {
                screenAwakeOn = false;
                updateScreenAwakeButton();
            });
            screenAwakeOn = true;
            updateScreenAwakeButton();
        } else {
            alert("Screen awake is not supported on this device.");
        }
    } catch (err) {
        console.error("Wake Lock error:", err);
        alert("Could not keep the screen awake.");
    }
}

async function releaseWakeLock() {
    try {
        if (wakeLock) {
            await wakeLock.release();
            wakeLock = null;
        }
        screenAwakeOn = false;
        updateScreenAwakeButton();
    } catch (err) {
        console.error("Release Wake Lock error:", err);
    }
}

function setupScreenAwakeToggle() {
    const btn = document.createElement("button");
    btn.id = "screenAwakeToggle";
    btn.classList.add("screen-awake-toggle");
    document.body.appendChild(btn);

    btn.addEventListener("click", async () => {
        if (screenAwakeOn) {
            await releaseWakeLock();
        } else {
            await requestWakeLock();
        }
    });

    updateScreenAwakeButton();

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            releaseWakeLock();
        }
    });
}

function updateScreenAwakeButton() {
    const btn = document.getElementById("screenAwakeToggle");
    if (!btn) return;

    if (screenAwakeOn) {
        btn.textContent = "☀️ Screen Awake is On";
        btn.classList.add("on");
    } else {
        btn.textContent = "🌙 Screen Awake is Off";
        btn.classList.remove("on");
    }
}
