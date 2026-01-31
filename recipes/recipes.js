/* ---------------------------------------------------------
   RECIPES LIST PAGE
--------------------------------------------------------- */

let activeTags = [];
let showFavoritesOnly = false;

document.addEventListener("DOMContentLoaded", () => {
    setupFilters();
    loadRecipes();
});

/* ---------------------------------------------------------
   FILTER BAR SETUP
--------------------------------------------------------- */
function setupFilters() {
    const tagContainer = document.getElementById("tagFilters");
    tagContainer.innerHTML = "";

    // ALL button
    document.querySelector("[data-filter='all']").addEventListener("click", () => {
        resetFilters();
        loadRecipes();
    });

    // FAVORITES button
    document.querySelector("[data-filter='fav']").addEventListener("click", (e) => {
        e.target.classList.toggle("active");
        showFavoritesOnly = e.target.classList.contains("active");

        // Deselect ALL
        document.querySelector("[data-filter='all']").classList.remove("active");

        loadRecipes();
    });

    // TAG BUTTONS (dynamic)
    const tags = StorageService.getTags();

    tags.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.textContent = tag;

        btn.addEventListener("click", () => {
            btn.classList.toggle("active");

            if (btn.classList.contains("active")) {
                activeTags.push(tag);
            } else {
                activeTags = activeTags.filter(t => t !== tag);
            }

            // Deselect ALL when tags are used
            document.querySelector("[data-filter='all']").classList.remove("active");

            loadRecipes();
        });

        tagContainer.appendChild(btn);
    });

    // Default to ALL active
    document.querySelector("[data-filter='all']").classList.add("active");
}

/* ---------------------------------------------------------
   RESET FILTERS
--------------------------------------------------------- */
function resetFilters() {
    activeTags = [];
    showFavoritesOnly = false;

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.querySelector("[data-filter='all']").classList.add("active");
}

/* ---------------------------------------------------------
   LOAD & FILTER RECIPES
--------------------------------------------------------- */
function loadRecipes() {
    const container = document.getElementById("recipesList");
    container.innerHTML = "";

    let recipes = StorageService.getAllRecipesSorted();

    // Favorites filter
    if (showFavoritesOnly) {
        recipes = recipes.filter(r => r.isFavorite);
    }

    // Tag filtering (must include ALL selected tags)
    if (activeTags.length > 0) {
        recipes = recipes.filter(recipe =>
            activeTags.every(tag => recipe.tags?.includes(tag))
        );
    }

    if (recipes.length === 0) {
        container.innerHTML = `<p>No recipes match your filters.</p>`;
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
                    ${recipe.isFavorite ? "★" : "☆"}
                </button>
            </div>

            <div class="recipe-tags">
                ${(recipe.tags || []).map(tag => `
                    <span class="tag-pill">${tag}</span>
                `).join("")}
            </div>

            <button class="small-btn mt-2" onclick="viewRecipe('${recipe.id}')">
                View
            </button>
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
   TOGGLE FAVORITE
--------------------------------------------------------- */
function toggleFavorite(id) {
    StorageService.toggleFavorite(id);
    loadRecipes(); // keeps sorting + filters
}
