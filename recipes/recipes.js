/* ---------------------------------------------------------
   RECIPES PAGE JS (Firebase + Filters)
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadRecipes();
});

/* -------------------- FILTER STATE -------------------- */
let activeFilters = {
  all: true,
  favorites: false,
  tags: []
};

/* -------------------- LOAD RECIPES -------------------- */
async function loadRecipes() {
  const container = document.getElementById("recipesList");
  container.innerHTML = "";

  // Get recipes and tags from Firebase
  let recipes = await FirebaseService.getAllRecipesSorted();
  const tags = await FirebaseService.getTags();

  // Add filter bar only once
  if (!document.querySelector(".filter-bar")) {
    const filterBar = document.createElement("div");
    filterBar.className = "filter-bar";

    // All button
    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn active";
    allBtn.textContent = "All";
    allBtn.onclick = () => applyFilter("all");
    filterBar.appendChild(allBtn);

    // Favorites button
    const favBtn = document.createElement("button");
    favBtn.className = "filter-btn";
    favBtn.textContent = "Favorites";
    favBtn.onclick = () => applyFilter("favorites");
    filterBar.appendChild(favBtn);

    // Tag buttons
    tags.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = tag;
      btn.onclick = () => toggleTagFilter(tag, btn);
      filterBar.appendChild(btn);
    });

    // Prepend to container
    container.parentElement.prepend(filterBar);
  }

  filterAndRender(recipes);
}

/* -------------------- FILTER FUNCTIONS -------------------- */
function applyFilter(type) {
  if (type === "all") {
    activeFilters.all = true;
    activeFilters.favorites = false;
    activeFilters.tags = [];
  } else if (type === "favorites") {
    activeFilters.all = false;
    activeFilters.favorites = true;
    activeFilters.tags = [];
  }
  updateFilterButtons();
  filterAndRender();
}

function toggleTagFilter(tag, btn) {
  const index = activeFilters.tags.indexOf(tag);
  if (index > -1) {
    activeFilters.tags.splice(index, 1);
    btn.classList.remove("active");
  } else {
    activeFilters.tags.push(tag);
    btn.classList.add("active");
  }
  activeFilters.all = false;
  activeFilters.favorites = false;
  updateFilterButtons();
  filterAndRender();
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    if (btn.textContent === "All") btn.classList.toggle("active", activeFilters.all);
    if (btn.textContent === "Favorites") btn.classList.toggle("active", activeFilters.favorites);
  });
}

async function filterAndRender(recipes = null) {
  if (!recipes) recipes = await FirebaseService.getAllRecipesSorted();

  let filtered = [...recipes];

  if (activeFilters.favorites) {
    filtered = filtered.filter(r => r.isFavorite);
  }

  if (activeFilters.tags.length > 0) {
    filtered = filtered.filter(r => r.tags.some(t => activeFilters.tags.includes(t)));
  }

  renderRecipes(filtered);
}

/* -------------------- RENDER RECIPES -------------------- */
function renderRecipes(recipes) {
  const container = document.getElementById("recipesList");
  container.innerHTML = "";

  if (recipes.length === 0) {
    container.innerHTML = `<p>No recipes found.</p>`;
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

/* -------------------- FAVORITE TOGGLE -------------------- */
async function toggleFavorite(id, btn) {
  const isFav = await FirebaseService.toggleFavorite(id);
  btn.classList.toggle("active", isFav);
  btn.textContent = isFav ? "⭐" : "☆";
  filterAndRender(); // re-render filtered list
}

/* -------------------- VIEW RECIPE -------------------- */
function viewRecipe(id) {
  window.location.href = `view-recipe.html?id=${id}`;
}
