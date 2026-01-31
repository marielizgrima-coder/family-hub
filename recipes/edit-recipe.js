let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadExistingTags();
  checkIfEditing();
});

async function loadExistingTags() {
  const select = document.getElementById("existingTags");
  select.innerHTML = "";

  const tags = await FirebaseService.getTags();
  tags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  });
}

async function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");

  if (editingId) {
    document.getElementById("pageTitle").textContent = "Edit Recipe";
    loadRecipeData(editingId);
  }
}

async function loadRecipeData(id) {
  const recipe = await FirebaseService.getRecipe(id);
  if (!recipe) return;

  document.getElementById("recipeName").value = recipe.title || "";

  (recipe.tags || []).forEach(tag => addTagPill(tag));
  (recipe.ingredients || []).forEach(ing => addIngredientRow(ing.amount, ing.unit, ing.name));

  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";
  document.getElementById("instructions").value = recipe.instructions || "";

  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", recipe.isFavorite);
  favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";
}

async function saveRecipe() {
  const title = document.getElementById("recipeName").value.trim();
  if (!title) return alert("Recipe must have a name.");

  const tags = [...document.querySelectorAll("#tagContainer .tag-pill")].map(p => p.dataset.tag);
  const ingredients = [...document.querySelectorAll(".ingredient-row")].map(row => ({
    amount: parseFloat(row.querySelector(".ing-amount").value) || 0,
    unit: row.querySelector(".ing-unit").value,
    name: row.querySelector(".ing-name").value
  })).filter(ing => ing.name);

  const recipeData = {
    title,
    tags,
    ingredients,
    cookingTime: parseInt(document.getElementById("cookingTime").value) || 0,
    ovenTemp: parseInt(document.getElementById("ovenTemp").value) || 0,
    servings: document.getElementById("servings").value.trim(),
    instructions: document.getElementById("instructions").value.trim()
  };

  if (editingId) {
    await FirebaseService.updateRecipe(editingId, recipeData);
  } else {
    editingId = await FirebaseService.addRecipe(recipeData);
  }

  window.location.href = "recipes.html";
}
