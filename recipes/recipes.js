// recipes.js
document.addEventListener("DOMContentLoaded", () => {
  loadRecipes();
});

let activeTagFilters = [];

async function loadRecipes() {
  const container = document.getElementById("recipesList");
  container.innerHTML = "";

  const recipes = await firebase-service.getAllRecipesSorted();
  const tags = await firebase-service.getTags();

  // Filter bar
  const filterBar = document.createElement("div");
  filterBar.className = "filter-bar";

  // All button
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "All";
  allBtn.onclick = () => {
    activeTagFilters = [];
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    allBtn.classList.add("active");
    renderRecipes(recipes);
  };

  // Favorites button
  const favBtn = document.createElement("button");
  favBtn.className = "filter-btn";
  favBtn.textContent = "Favorites";
  favBtn.onclick = () => {
    activeTagFilters = ["favorites"];
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    favBtn.classList.add("active");
    renderRecipes(recipes);
  };

  filterBar.append(allBtn, favBtn);

  // Tag buttons
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = tag;
    btn.onclick = () => toggleTagFilter(tag, btn, recipes);
    filterBar.appendChild(btn);
  });

  container.parentElement.prepend(filterBar);
  renderRecipes(recipes);
}

function toggleTagFilter(tag, btn, recipes) {
  const index = activeTagFilters.indexOf(tag);
  if (index === -1) {
    activeTagFilters.push(tag);
    btn.classList.add("active");
  } else {
    activeTagFilters.splice(index, 1);
    btn.classList.remove("active");
  }

  renderRecipes(recipes);
}

function renderRecipes(recipes) {
  const container = document.getElementById("recipesList");
  container.innerHTML = "";

  let filtered = recipes;

  if (activeTagFilters.includes("favorites")) {
    filtered = filtered.filter(r => r.isFavorite);
  }

  if (activeTagFilters.length > 0) {
    const tagFilters = activeTagFilters.filter(f => f !== "favorites");
    if (tagFilters.length > 0) {
      filtered = filtered.filter(r => r.tags && r.tags.some(t => tagFilters.includes(t)));
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  filtered.forEach(recipe => {
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
  const isFav = await firebase-service.toggleFavorite(id);
  btn.classList.toggle("active", isFav);
  btn.textContent = isFav ? "⭐" : "☆";
  loadRecipes();
}

function viewRecipe(id) {
  window.location.href = `view-recipe.html?id=${id}`;
}
