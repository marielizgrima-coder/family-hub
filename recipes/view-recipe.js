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
    document.getElementById("recipeTitle").textContent = recipe.title;

    // Tags
    const tagContainer = document.getElementById("recipeTags");
    tagContainer.innerHTML = (recipe.tags || [])
        .map(t => `<span class="tag-pill">${t}</span>`)
        .join("");

    // Ingredients
    const ingList = document.getElementById("ingredientsList");
    ingList.innerHTML = (recipe.ingredients || [])
        .map(ing => `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`)
        .join("");

    // Cooking info
    document.getElementById("cookingTime").textContent = recipe.cookingTime || "-";
    document.getElementById("ovenTemp").textContent = recipe.ovenTemp || "-";
    document.getElementById("servings").textContent = recipe.servings || "-";

    // Instructions
    document.getElementById("instructionsText").textContent = recipe.instructions || "";

    // Favourite star
    const favBtn = document.getElementById("favBtn");
    favBtn.classList.toggle("active", recipe.isFavorite);
    favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";
    favBtn.onclick = toggleFavorite;

    // Edit button
    document.getElementById("editBtn").onclick = () => {
        window.location.href = `edit-recipe.html?id=${recipeId}`;
    };
}

/* ---------------------------------------------------------
   TOGGLE FAVOURITE
--------------------------------------------------------- */
function toggleFavorite() {
    const isFav = StorageService.toggleFavorite(recipeId);

    const favBtn = document.getElementById("favBtn");
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "⭐" : "☆";
}
