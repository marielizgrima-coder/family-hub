let recipeId = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  recipeId = params.get("id");

  if (!recipeId) return alert("Recipe not found.");
  loadRecipe();
});

async function loadRecipe() {
  const recipe = await FirebaseService.getRecipe(recipeId);
  if (!recipe) return alert("Recipe not found.");

  document.getElementById("recipeTitle").textContent = recipe.title || "";
  document.getElementById("recipeTags").innerHTML = (recipe.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("");
  document.getElementById("ingredientsList").innerHTML = (recipe.ingredients || []).map(ing => `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`).join("");
  document.getElementById("cookingTime").textContent = formatCookingTime(recipe.cookingTime);
  document.getElementById("ovenTemp").textContent = recipe.ovenTemp ? `${recipe.ovenTemp}°C` : "-";
  document.getElementById("servings").textContent = recipe.servings || "-";
  document.getElementById("instructionsText").textContent = recipe.instructions || "";

  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", recipe.isFavorite);
  favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";
  favBtn.onclick = toggleFavorite;
}

async function toggleFavorite() {
  const isFav = await FirebaseService.toggleFavorite(recipeId);
  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", isFav);
  favBtn.textContent = isFav ? "⭐" : "☆";
}

function formatCookingTime(value) {
  const mins = parseInt(value, 10);
  if (isNaN(mins) || mins <= 0) return "-";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr${hrs > 1 ? "s" : ""}` : `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} mins`;
}
