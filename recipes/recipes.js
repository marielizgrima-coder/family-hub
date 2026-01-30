/* ---------------------------------------------------------
   RECIPES LIST PAGE
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    loadRecipes();
});

/* ---------------------------------------------------------
   LOAD RECIPES
--------------------------------------------------------- */
function loadRecipes() {
    const container = document.getElementById("recipesList");
    container.innerHTML = "";

    const recipes = StorageService.getAllRecipesSorted();

    if (recipes.length === 0) {
        container.innerHTML = `<p>No recipes yet. Add one!</p>`;
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement("div");
        card.classList.add("recipe-card");

        card.innerHTML = `
            <div class="flex-between">
                <h3 class="recipe-title">${recipe.title}</h3>

                <button class="star-btn ${recipe.isFavorite ? "active" : ""}"
                        onclick="toggleFavorite('${recipe.id}', this)">
                    ${recipe.isFavorite ? "⭐" : "☆"}
                </button>
            </div>

            <div class="recipe-tags">
                ${(recipe.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("")}
            </div>

            const viewBtn = card.querySelector(".view-btn");
            viewBtn.addEventListener("click", () => viewRecipe(recipe.id));

        `;

        container.appendChild(card);
    });
}

/* ---------------------------------------------------------
   VIEW RECIPE
--------------------------------------------------------- */
function viewRecipe(id) {
    window.location.href = `view-recipe.html?id=${id}`;
}

/* ---------------------------------------------------------
   TOGGLE FAVOURITE
--------------------------------------------------------- */
function toggleFavorite(id, btn) {
    const isFav = StorageService.toggleFavorite(id);

    btn.classList.toggle("active", isFav);
    btn.textContent = isFav ? "⭐" : "☆";

    loadRecipes(); // refresh sorting
}
