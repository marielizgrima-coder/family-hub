/* ---------------------------------------------------------
   RECIPES LIST PAGE
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    loadRecipes();
    setupFilters();
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
/* ---------------------------------------------------------
   FILTERS SETUP
--------------------------------------------------------- */
function setupFilters() {
    const tagContainer = document.getElementById("tagFilters");
    tagContainer.innerHTML = "";

    const tags = StorageService.getTags();
    tags.forEach(tag => {
        const btn = document.createElement("button");
        btn.classList.add("filter-btn");
        btn.textContent = tag;
        btn.dataset.tag = tag;
        btn.addEventListener("click", () => toggleTagFilter(btn));
        tagContainer.appendChild(btn);
    });

    document.querySelector(".filter-btn[data-filter='all']").addEventListener("click", () => {
        clearFilters();
        applyFilters();
    });

    document.querySelector(".filter-btn[data-filter='fav']").addEventListener("click", (e) => {
        // Toggle favorite button
        e.target.classList.toggle("active");
        // Clicking Fav deselects All
        document.querySelector(".filter-btn[data-filter='all']").classList.remove("active");
        applyFilters();
    });
}

/* Toggle individual tag */
function toggleTagFilter(btn) {
    btn.classList.toggle("active");
    // Clicking tag deselects All
    document.querySelector(".filter-btn[data-filter='all']").classList.remove("active");
    applyFilters();
}

/* Clear all filters */
function clearFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        if (!btn.dataset.filter) btn.classList.remove("active");
    });
    document.querySelector(".filter-btn[data-filter='fav']").classList.remove("active");
}

/* Apply active filters to recipes */
function applyFilters() {
    const allBtn = document.querySelector(".filter-btn[data-filter='all']");
    const favBtn = document.querySelector(".filter-btn[data-filter='fav']");
    const activeTags = [...document.querySelectorAll("#tagFilters .filter-btn.active")].map(b => b.dataset.tag);

    const recipes = StorageService.getAllRecipesSorted();
    const container = document.getElementById("recipesList");
    container.innerHTML = "";

    let filtered = recipes;

    // Apply Favorites filter
    if (favBtn.classList.contains("active")) {
        filtered = filtered.filter(r => r.isFavorite);
    }

    // Apply tags filter
    if (activeTags.length > 0) {
        filtered = filtered.filter(r => r.tags && activeTags.every(t => r.tags.includes(t)));
    }

    // If All is active or no filters, show everything
    if (allBtn.classList.contains("active") || (!favBtn.classList.contains("active") && activeTags.length === 0)) {
        filtered = recipes;
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        allBtn.classList.add("active");
    }

    // Render filtered recipes
    if (filtered.length === 0) {
        container.innerHTML = `<p>No recipes match your filters.</p>`;
        return;
    }

    filtered.forEach(recipe => {
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
            <button class="small-btn mt-2" onclick="viewRecipe('${recipe.id}')">View</button>
        `;
        container.appendChild(card);
    });
}

