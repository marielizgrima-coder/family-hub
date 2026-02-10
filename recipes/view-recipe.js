// view-recipe.js
let recipeId = null;
let wakeLock = null;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  recipeId = params.get("id");

  if (!recipeId) {
    alert("Recipe not found.");
    window.location.href = "recipes.html";
    return;
  }

  await loadRecipe();

  // Screen awake toggle
  const screenBtn = document.getElementById("screenAwakeBtn");
  if (screenBtn) {
    screenBtn.onclick = toggleScreenAwake;
  }

  // Edit button
  const editBtn = document.getElementById("editBtn");
  if (editBtn) {
    editBtn.onclick = () => {
      window.location.href = `edit-recipe.html?id=${recipeId}`;
    };
  }
});

// Load the recipe and render
async function loadRecipe() {
  const recipe = await FirebaseService.getRecipe(recipeId);

  if (!recipe) {
    alert("Recipe not found.");
    window.location.href = "recipes.html";
    return;
  }

  // Title
  const titleEl = document.getElementById("recipeTitle");
  if (titleEl) titleEl.textContent = recipe.title || "";

  // Tags
  const tagsContainer = document.getElementById("recipeTags");
  if (tagsContainer) {
    tagsContainer.innerHTML = "";

    (recipe.tags || []).forEach(tag => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = tag;
      tagsContainer.appendChild(pill);
    });
  }

  // Ingredients
  const ingList = document.getElementById("ingredientsList");
  if (ingList) {
    ingList.innerHTML = "";

    (recipe.ingredients || []).forEach(ing => {
      const li = document.createElement("li");

      const amount = ing.amount !== "" && ing.amount !== null && ing.amount !== undefined
        ? ing.amount
        : "";

      const unit = ing.unit ? ing.unit.trim() : "";
      const name = ing.name ? ing.name.trim() : "";

      let text = `${amount} ${unit} ${name}`.trim().replace(/\s+/g, " ");
      if (!text) text = "-";

      li.textContent = text;
      ingList.appendChild(li);
    });
  }

  // Cooking info
  const cookingTimeEl = document.getElementById("cookingTime");
  if (cookingTimeEl) cookingTimeEl.textContent = formatCookingTime(recipe.cookingTime);

  const ovenTempEl = document.getElementById("ovenTemp");
  if (ovenTempEl) ovenTempEl.textContent = recipe.ovenTemp ? `${recipe.ovenTemp}°C` : "-";

  const servingsEl = document.getElementById("servings");
  if (servingsEl) servingsEl.textContent = recipe.servings || "-";

  const instructionsEl = document.getElementById("instructionsText");
  if (instructionsEl) instructionsEl.textContent = recipe.instructions || "-";

  // Favorite button
  const favBtn = document.getElementById("favBtn");
  if (favBtn) {
    favBtn.classList.toggle("active", recipe.isFavorite);
    favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";

    favBtn.onclick = async () => {
      const newFav = await FirebaseService.toggleFavorite(recipeId);
      favBtn.classList.toggle("active", newFav);
      favBtn.textContent = newFav ? "⭐" : "☆";
    };
  }
}

// Format cooking time nicely
function formatCookingTime(value) {
  const mins = parseInt(value, 10);

  if (isNaN(mins) || mins <= 0) return "-";
  if (mins < 60) return `${mins} mins`;

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;

  if (rem === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} mins`;
}

// Keep screen on toggle (real Wake Lock API)
async function toggleScreenAwake() {
  const btn = document.getElementById("screenAwakeBtn");
  if (!btn) return;

  // If already active -> turn off
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;

    btn.classList.remove("on");
    btn.textContent = "Keep Screen On";
    return;
  }

  // Try enabling
  try {
    if (!("wakeLock" in navigator)) {
      alert("Wake Lock not supported in this browser.");
      return;
    }

    wakeLock = await navigator.wakeLock.request("screen");

    btn.classList.add("on");
    btn.textContent = "Screen Awake On";

    wakeLock.addEventListener("release", () => {
      wakeLock = null;
      btn.classList.remove("on");
      btn.textContent = "Keep Screen On";
    });

  } catch (err) {
    console.error("Wake Lock error:", err);
    alert("Could not keep screen awake.");
  }
}
