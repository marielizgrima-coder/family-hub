/* ---------------------------------------------------------
   VIEW RECIPE PAGE
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    loadRecipe();
});

function getRecipeId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function loadRecipe() {
    const recipeId = getRecipeId();
    if (!recipeId) {
        alert("No recipe ID found.");
        window.location.href = "recipes.html";
        return;
    }

    const recipe = StorageService.getRecipe(recipeId);
    if (!recipe) {
        alert("Recipe not found.");
        window.location.href = "recipes.html";
        return;
    }

    // Fill title
    document.getElementById("recipeTitle").textContent = recipe.title;

    // Tags
    const tagContainer = document.getElementById("recipeTags");
    tagContainer.innerHTML = "";
    (recipe.tags || []).forEach(tag => {
        const pill = document.createElement("span");
        pill.classList.add("tag-pill");
        pill.textContent = tag;
        tagContainer.appendChild(pill);
    });

    // Ingredients
    const ingList = document.getElementById("ingredientsList");
    ingList.innerHTML = "";
    (recipe.ingredients || []).forEach(ing => {
        const li = document.createElement("li");
        li.innerHTML = `
            <label>
                <input type="checkbox" class="ingredient-check">
                ${ing.amount} ${ing.unit} ${ing.name}
            </label>
        `;
        ingList.appendChild(li);
    });

    // Cooking info
    document.getElementById("cookingTime").textContent = recipe.cookingTime || "—";
    document.getElementById("ovenTemp").textContent = recipe.ovenTemp || "—";
    document.getElementById("servings").textContent = recipe.servings || "—";

   // Time formatting
   function formatTime(minutes) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) return "";

    if (mins < 60) {
        return `${mins} mins`;
    }

    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;

    if (remaining === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remaining} mins`;
}

// Temperature
   function formatTemp(temp) {
    if (!temp) return "";
    return `${temp}°C`;
}

    // Instructions
    document.getElementById("instructionsText").textContent =
        recipe.instructions || "No instructions provided.";
}

function editRecipe() {
    const recipeId = getRecipeId();
    window.location.href = `edit-recipe.html?id=${recipeId}`;
}

