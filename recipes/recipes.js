document.addEventListener("DOMContentLoaded", () => {
  loadRecipes();
});

// Load recipes and apply filters
async function loadRecipes() {
  const container = document.getElementById("recipesList");
  container.innerHTML = "";

  let recipes = await FirebaseService.getAllRecipesSorted();
  const tags = await FirebaseService.getTags();

  // Add filter bar dynamically
  const filterBar = document.createElement("div");
  filterBar.className = "filter-bar";

  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "All";
  allBtn.onclick = () => applyFilter("all");

  const favBtn = document.createElement("button");
  favBtn.className = "filter-btn";
  favBtn.textContent = "Favorites";
  favBtn.onclick = () => applyFilter("favorites");

  filterBar.append(allBtn, favBtn);

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = tag;
    btn.onclick = () => toggleTagFilter(tag, btn);
    filterBar.appendChild(btn);
  });

  container.parentElement.prepend(filterBar);

  renderRecipes(recipes);
}

// Render recipe cards
function renderRecipes(recipes) {
  const container = document.getElementById("recipesList");
  container.innerHTML = "";

  if (recipes.length === 0) {
    container.innerHTML = `<p>No recipes yet. Add one!</p>`;
    return;
  }

  recipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <div class="flex-between">
        <h3 class="recipe-title">${recipe.title}</h3>
        <button class="star-btn ${recipe.isFavorite ? "active" : ""}" onclick="toggleFavorite('${recipe.id}', this)">
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

async function toggleFavorite(id, btn) {
  const isFav = await FirebaseService.toggleFavorite(id);
  btn.classList.toggle("active", isFav);
  btn.textContent = isFav ? "⭐" : "☆";
  loadRecipes();
}

function viewRecipe(id) {
  window.location.href = `view-recipe.html?id=${id}`;
}
