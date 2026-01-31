let recipeId = null;
let screenAwake = false;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  recipeId = params.get("id");

  if (!recipeId) return alert("Recipe not found.");

  await loadRecipe();

  // Keep Screen On toggle
  const screenBtn = document.getElementById("screenAwakeBtn");
  screenBtn.addEventListener("click", () => {
    screenAwake = !screenAwake;
    screenBtn.textContent = screenAwake ? "Screen On ✔" : "Keep Screen On";
    screenBtn.classList.toggle("on", screenAwake);
    // Could use Wake Lock API in the future
  });

  // Edit button
  document.getElementById("editBtn").addEventListener("click", () => {
    window.location.href = `edit-recipe.html?id=${recipeId}`;
  });
});

async function loadRecipe() {
  const recipe = await FirebaseService.getRecipe(recipeId);
  if (!recipe) return alert("Recipe not found.");

  document.getElementById("recipeTitle").textContent = recipe.title || "";
  document.getElementById("recipeTags").innerHTML = (recipe.tags || [])
    .map(t => `<span class="tag-pill">${t}</span>`).join("");

  document.getElementById("ingredientsList").innerHTML = (recipe.ingredients || [])
    .map(ing => `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`).join("");

  document.getElementById("cookingTime").textContent = formatCookingTime(recipe.cookingTime);
  document.getElementById("ovenTemp").textContent = recipe.ovenTemp ? `${recipe.ovenTemp}°C` : "-";
  document.getElementById("servings").textContent = recipe.servings || "-";
  document.getElementById("instructionsText").textContent = recipe.instructions || "";

  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", recipe.isFavorite);
  favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";

  favBtn.onclick = async () => {
    const isFav = await FirebaseService.toggleFavorite(recipeId);
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "⭐" : "☆";
  };
}

function formatCookingTime(value) {
  const mins = parseInt(value, 10);
  if (isNaN(mins) || mins <= 0) return "-";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr${hrs > 1 ? "s" : ""}` : `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} mins`;
}
