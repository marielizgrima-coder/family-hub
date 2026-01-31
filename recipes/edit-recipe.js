let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExistingTags();
  await checkIfEditing();

  // Delete button
  document.getElementById("deleteBtn").addEventListener("click", async () => {
    if (!editingId) return;
    if (!confirm("Delete this recipe?")) return;
    await FirebaseService.deleteRecipe(editingId);
    window.location.href = "recipes.html";
  });

  // Favorite toggle
  document.getElementById("favBtn").addEventListener("click", async () => {
    if (!editingId) return;
    const favBtn = document.getElementById("favBtn");
    const isFav = await FirebaseService.toggleFavorite(editingId);
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "⭐" : "☆";
  });
});

// -------------------- TAGS --------------------
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

function addExistingTag() {
  const select = document.getElementById("existingTags");
  const tag = select.value;
  if (!tag) return;
  addTagPill(tag);
  select.selectedIndex = 0;
}

function addNewTag() {
  const input = document.getElementById("newTagInput");
  const tag = input.value.trim();
  if (!tag) return;
  FirebaseService.addTag(tag);
  addTagPill(tag);
  input.value = "";
}

function addTagPill(tag) {
  const container = document.getElementById("tagContainer");
  const existing = [...container.querySelectorAll(".tag-pill")].map(p => p.dataset.tag);
  if (existing.includes(tag)) return;

  const pill = document.createElement("span");
  pill.classList.add("tag-pill");
  pill.dataset.tag = tag;
  pill.innerHTML = `${tag} <span class="remove-tag" onclick="removeTag(this)">×</span>`;
  container.appendChild(pill);
}

function removeTag(el) {
  el.parentElement.remove();
}

// -------------------- INGREDIENTS --------------------
function addIngredientRow(amount = "", unit = "", name = "") {
  const container = document.getElementById("ingredientsContainer");
  const row = document.createElement("div");
  row.classList.add("ingredient-row");

  row.innerHTML = `
    <input type="number" class="ing-amount" placeholder="Amt" value="${amount}" step="0.01" min="0">
    <select class="ing-unit">
      <option value="">Unit</option>
      <option value="g">g</option>
      <option value="kg">kg</option>
      <option value="ml">ml</option>
      <option value="l">l</option>
      <option value="tsp">tsp</option>
      <option value="tbsp">tbsp</option>
      <option value="cup">cup</option>
      <option value="oz">oz</option>
      <option value="lb">lb</option>
      <option value="piece">piece</option>
      <option value="item">item</option>
      <option value="whole">whole</option>
    </select>
    <input type="text" class="ing-name" placeholder="Ingredient" value="${name}">
    <button class="delete-ingredient" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(row);
}

// -------------------- MULTIPLIER --------------------
function applyMultiplier(multiplier) {
  document.querySelectorAll(".ingredient-row").forEach(row => {
    const input = row.querySelector(".ing-amount");
    const val = parseFloat(input.value || 0);
    input.value = (val * multiplier).toFixed(2).replace(/\.00$/, "");
  });
}

// -------------------- EDITING --------------------
async function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");

  if (!editingId) return;

  document.getElementById("pageTitle").textContent = "Edit Recipe";
  document.getElementById("deleteBtn").style.display = "inline-block";

  const recipe = await FirebaseService.getRecipe(editingId);
  if (!recipe) return;

  document.getElementById("recipeName").value = recipe.title || "";
  (recipe.tags || []).forEach(addTagPill);
  (recipe.ingredients || []).forEach(i => addIngredientRow(i.amount, i.unit, i.name));
  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";
  document.getElementById("instructions").value = recipe.instructions || "";

  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", recipe.isFavorite);
  favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";
}

// -------------------- SAVE --------------------
async function saveRecipe() {
  const title = document.getElementById("recipeName").value.trim();
  if (!title) return alert("Recipe must have a name.");

  const tags = [...document.querySelectorAll("#tagContainer .tag-pill")].map(p => p.dataset.tag);
  const ingredients = [...document.querySelectorAll(".ingredient-row")].map(row => ({
    amount: parseFloat(row.querySelector(".ing-amount").value) || 0,
    unit: row.querySelector(".ing-unit").value,
    name: row.querySelector(".ing-name").value
  })).filter(i => i.name);

  const data = {
    title,
    tags,
    ingredients,
    cookingTime: parseInt(document.getElementById("cookingTime").value) || 0,
    ovenTemp: parseInt(document.getElementById("ovenTemp").value) || 0,
    servings: document.getElementById("servings").value.trim(),
    instructions: document.getElementById("instructions").value.trim()
  };

  if (editingId) {
    await FirebaseService.updateRecipe(editingId, data);
  } else {
    editingId = await FirebaseService.addRecipe(data);
  }

  window.location.href = "recipes.html";
}
