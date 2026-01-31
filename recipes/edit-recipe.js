// edit-recipe.js
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExistingTags();
  checkIfEditing();
});

// Load tags from Firebase into the select dropdown
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

// Check if editing an existing recipe
async function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");

  if (editingId) {
    document.getElementById("pageTitle").textContent = "Edit Recipe";
    await loadRecipeData(editingId);
    document.getElementById("deleteBtn").style.display = "inline-block";
    document.getElementById("deleteBtn").onclick = deleteRecipe;
  }
}

// Load a recipe into the form
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
  favBtn.onclick = toggleFavorite;
}

// Add a tag pill from select dropdown
function addExistingTag() {
  const select = document.getElementById("existingTags");
  const tag = select.value;
  if (!tag) return;
  addTagPill(tag);
}

// Add a new tag from input
async function addNewTag() {
  const input = document.getElementById("newTagInput");
  const tag = input.value.trim();
  if (!tag) return;
  await FirebaseService.addTag(tag);
  addTagPill(tag);
  input.value = "";
  await loadExistingTags();
}

// Helper to add a tag pill to the container
function addTagPill(tag) {
  const container = document.getElementById("tagContainer");
  if ([...container.children].some(p => p.dataset.tag === tag)) return; // avoid duplicates

  const pill = document.createElement("div");
  pill.className = "tag-pill";
  pill.dataset.tag = tag;
  pill.textContent = tag;

  const remove = document.createElement("span");
  remove.className = "remove-tag";
  remove.textContent = "×";
  remove.onclick = () => pill.remove();

  pill.appendChild(remove);
  container.appendChild(pill);
}

// Add a blank ingredient row or prefill if arguments are provided
function addIngredientRow(amount = "", unit = "", name = "") {
  const container = document.getElementById("ingredientsContainer");

  const row = document.createElement("div");
  row.className = "ingredient-row";

  row.innerHTML = `
    <input type="number" class="ing-amount" placeholder="Amount" value="${amount}">
    <input type="text" class="ing-unit" placeholder="Unit" value="${unit}">
    <input type="text" class="ing-name" placeholder="Ingredient" value="${name}">
    <button class="delete-ingredient">×</button>
  `;

  row.querySelector(".delete-ingredient").onclick = () => row.remove();

  container.appendChild(row);
}

// Apply multiplier to all amounts
function applyMultiplier(factor) {
  document.querySelectorAll(".ingredient-row .ing-amount").forEach(input => {
    const val = parseFloat(input.value) || 0;
    input.value = (val * factor).toFixed(2);
  });
}

// Toggle favorite
async function toggleFavorite() {
  if (!editingId) return;
  const favBtn = document.getElementById("favBtn");
  const newFav = !favBtn.classList.contains("active");
  favBtn.classList.toggle("active", newFav);
  favBtn.textContent = newFav ? "⭐" : "☆";
}

// Save recipe to Firebase
async function saveRecipe() {
  const title = document.getElementById("recipeName").value.trim();
  if (!title) return alert("Recipe must have a name.");

  const tags = [...document.querySelectorAll("#tagContainer .tag-pill")].map(p => p.dataset.tag);
  const ingredients = [...document.querySelectorAll(".ingredient-row")].map(row => ({
    amount: parseFloat(row.querySelector(".ing-amount").value) || 0,
    unit: row.querySelector(".ing-unit").value.trim(),
    name: row.querySelector(".ing-name").value.trim()
  })).filter(ing => ing.name);

  const recipeData = {
    title,
    tags,
    ingredients,
    cookingTime: parseInt(document.getElementById("cookingTime").value) || 0,
    ovenTemp: parseInt(document.getElementById("ovenTemp").value) || 0,
    servings: document.getElementById("servings").value.trim(),
    instructions: document.getElementById("instructions").value.trim(),
    isFavorite: document.getElementById("favBtn").classList.contains("active")
  };

  if (editingId) {
    await FirebaseService.updateRecipe(editingId, recipeData);
  } else {
    editingId = await FirebaseService.addRecipe(recipeData);
  }

  window.location.href = "recipes.html";
}

// Delete recipe
async function deleteRecipe() {
  if (!editingId) return;
  if (!confirm("Are you sure you want to delete this recipe?")) return;
  await FirebaseService.deleteRecipe(editingId);
  window.location.href = "recipes.html";
}
