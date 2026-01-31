/* ---------------------------------------------------------
   VIEW RECIPE PAGE
--------------------------------------------------------- */

let recipeId = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    recipeId = params.get("id");

    if (!recipeId) {
        alert("Recipe not found.");
        window.location.href = "recipes.html";
        return;
    }

    loadRecipe();
    initScreenAwakeToggle();
});

/* ---------------------------------------------------------
   LOAD RECIPE
--------------------------------------------------------- */
function loadRecipe() {
    const recipe = StorageService.getRecipe(recipeId);
    if (!recipe) {
        alert("Recipe not found.");
        window.location.href = "recipes.html";
        return;
    }

    // Title
    document.getElementById("recipeTitle").textContent = recipe.title || "";

    // Tags
    const tagContainer = document.getElementById("recipeTags");
    tagContainer.innerHTML = (recipe.tags || [])
        .map(t => `<span class="tag-pill">${t}</span>`)
        .join("");

    // Ingredients
    const ingList = document.getElementById("ingredientsList");
    ingList.innerHTML = (recipe.ingredients || [])
        .map(ing => {
            const amount =
                ing.amount === "" || ing.amount === undefined
                    ? ""
                    : formatFraction(ing.amount);
            const unit = ing.unit ? ` ${ing.unit}` : "";
            return `<li>${amount}${unit} ${ing.name}</li>`;
        })
        .join("");

    // Cooking info
    document.getElementById("cookingTime").textContent = formatCookingTime(recipe.cookingTime);
    document.getElementById("ovenTemp").textContent = recipe.ovenTemp ? `${recipe.ovenTemp}°C` : "-";
    document.getElementById("servings").textContent = recipe.servings || "-";

    // Instructions
    document.getElementById("instructionsText").textContent = recipe.instructions || "";

    // Favourite star
    const favBtn = document.getElementById("favBtn");
    favBtn.classList.toggle("active", recipe.isFavorite);
    favBtn.textContent = recipe.isFavorite ? "☆" : "☆";
    favBtn.onclick = toggleFavorite;

    // Edit button
    document.getElementById("editBtn").onclick = () => {
        window.location.href = `edit-recipe.html?id=${recipeId}`;
    };
}

/* ---------------------------------------------------------
   FORMAT FRACTIONS
--------------------------------------------------------- */
function formatFraction(amount) {
    if (amount === 0.25) return "¼";
    if (amount === 0.5) return "½";
    if (amount === 0.75) return "¾";
    return amount;
}

/* ---------------------------------------------------------
   TOGGLE FAVOURITE
--------------------------------------------------------- */
function toggleFavorite() {
    const isFav = StorageService.toggleFavorite(recipeId);
    const favBtn = document.getElementById("favBtn");
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "☆" : "☆";
}

/* ---------------------------------------------------------
   COOKING TIME FORMATTING
--------------------------------------------------------- */
function formatCookingTime(value) {
    const mins = parseInt(value, 10);
    if (isNaN(mins) || mins <= 0) return "-";

    if (mins < 60) return `${mins} mins`;

    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;

    if (remaining === 0) {
        return hours === 1 ? "1 hr" : `${hours} hrs`;
    }

    return hours === 1 ? `1 hr ${remaining} mins` : `${hours} hrs ${remaining} mins`;
}

/* ---------------------------------------------------------
   SCREEN AWAKE TOGGLE
--------------------------------------------------------- */
function initScreenAwakeToggle() {
    const screenBtn = document.getElementById("screenAwakeBtn");
    if (!screenBtn) return;

    let wakeLock = null;

    screenBtn.addEventListener("click", async () => {
        if (wakeLock) {
            // Release wake lock
            await wakeLock.release();
            wakeLock = null;
            screenBtn.classList.remove("on");
            screenBtn.textContent = "Keep Screen On";
        } else {
            try {
                wakeLock = await navigator.wakeLock.request("screen");
                screenBtn.classList.add("on");
                screenBtn.textContent = "Screen Locked On";

                // Re-apply if page visibility changes
                document.addEventListener("visibilitychange", async () => {
                    if (wakeLock !== null && document.visibilityState === "visible") {
                        wakeLock = await navigator.wakeLock.request("screen");
                    }
                });
            } catch (err) {
                alert("Screen Wake Lock not supported on this device/browser.");
                console.error(err);
            }
        }
    });
}
