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

  if (!recipes.length) {
    container.innerHTML = `<p>No recipes yet. Add one!</p>`;
    return;
  }

  recipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <div class="flex-between">
        <h3 class="recipe-title">${recipe.title}</h3>
        <button class="star-btn ${recipe.isFavorite ? "active" : ""}">
          ${recipe.isFavorite ? "⭐" : "☆"}
        </button>
      </div>

      <div class="recipe-tags">
        ${(recipe.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("")}
      </div>

      <button class="small-btn mt-2 view-btn">View</button>
    `;

    const favBtn = card.querySelector(".star-btn");
    favBtn.addEventListener("click", () => {
      const isFav = StorageService.toggleFavorite(recipe.id);
      favBtn.classList.toggle("active", isFav);
      favBtn.textContent = isFav ? "⭐" : "☆";
      loadRecipes();
    });

    card.querySelector(".view-btn").addEventListener("click", () => {
      window.location.href = `view-recipe.html?id=${recipe.id}`;
    });

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
