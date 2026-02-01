// view-recipe.js
let recipeId = null;
let screenAwake = false;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  recipeId = params.get("id");

  if (!recipeId) return alert("Recipe not found.");

  await loadRecipe();

  // Setup screen awake toggle
  const screenBtn = document.getElementById("screenAwakeBtn");
  screenBtn.onclick = toggleScreenAwake;

  // Setup edit button
  const editBtn = document.getElementById("editBtn");
  editBtn.onclick = () => window.location.href = `edit-recipe.html?id=${recipeId}`;
});

// Load the recipe and render
async function loadRecipe() {
  const recipe = await firebase-service.getRecipe(recipeId);
  if (!recipe) return alert("Recipe not found.");

  document.getElementById("recipeTitle").textContent = recipe.title || "";
  document.getElementById("recipeTags").innerHTML =
    (recipe.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("");

  document.getElementById("ingredientsList").innerHTML =
    (recipe.ingredients || []).map(ing => `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`).join("");

  document.getElementById("cookingTime").textContent = formatCookingTime(recipe.cookingTime);
  document.getElementById("ovenTemp").textContent = recipe.ovenTemp ? `${recipe.ovenTemp}°C` : "-";
  document.getElementById("servings").textContent = recipe.servings || "-";
  document.getElementById("instructionsText").textContent = recipe.instructions || "-";

  // Favorite button
  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", recipe.isFavorite);
  favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";
  favBtn.onclick = toggleFavorite;
}

// Toggle favorite in Firebase
async function toggleFavorite() {
  const favBtn = document.getElementById("favBtn");
  const newFav = await firebase-service.toggleFavorite(recipeId);
  favBtn.classList.toggle("active", newFav);
  favBtn.textContent = newFav ? "⭐" : "☆";
}

// Format cooking time nicely
function formatCookingTime(value) {
  const mins = parseInt(value, 10);
  if (isNaN(mins) || mins <= 0) return "-";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr${hrs > 1 ? "s" : ""}` : `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} mins`;
}

// Keep screen on toggle (basic simulation using alert)
function toggleScreenAwake() {
  screenAwake = !screenAwake;
  const btn = document.getElementById("screenAwakeBtn");
  btn.classList.toggle("on", screenAwake);
  btn.textContent = screenAwake ? "Screen Awake On" : "Keep Screen On";

  if (screenAwake) {
    alert("Screen awake enabled (mobile/desktop simulation)");
  }
}
