let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExistingTags();
  checkIfEditing();
});

/* ---------- TAGS ---------- */

async function loadExistingTags() {
  const select = document.getElementById("existingTags");
  if (!select) return;

  select.innerHTML = `<option value="">Select tag</option>`;
  const tags = await FirebaseService.getTags();

  tags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  });
}

async function addExistingTag() {
  const select = document.getElementById("existingTags");
  if (select.value) addTagPill(select.value);
  select.value = "";
}

async function addNewTag() {
  const input = document.getElementById("newTagInput");
  const tag = input.value.trim();
  if (!tag) return;

  await FirebaseService.addTag(tag);
  addTagPill(tag);
  input.value = "";
  loadExistingTags();
}

function addTagPill(tag) {
  const container = document.getElementById("tagContainer");
  if ([...container.children].some(p => p.dataset.tag === tag)) return;

  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.dataset.tag = tag;
  pill.innerHTML = `${tag} <span class="remove-tag">×</span>`;
  pill.querySelector(".remove-tag").onclick = () => pill.remove();
  container.appendChild(pill);
}

/* ---------- EDIT MODE ---------- */

function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");
  if (editingId) loadRecipeData(editingId);
}

async function loadRecipeData(id) {
  const recipe = await FirebaseService.getRecipe(id);
  if (!recipe) return;

  document.getElementById("pageTitle").textContent = "Edit Recipe";
  document.getElementById("recipeName").value = recipe.title || "";

  (recipe.tags || []).forEach(addTagPill);
  (recipe.ingredients || []).forEach(i => addIngredientRow(i.amount, i.unit, i.name));

  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";
  document.getElementById("instructions").value = recipe.instructions || "";
}

/* ---------- INGREDIENTS ---------- */

function addIngredientRow(amount = "", unit = "", name = "") {
  const container = document.getElementById("ingredientsContainer");
  const row = document.createElement("div");
  row.className = "ingredient-row";

  row.innerHTML = `
    <input type="number" class="ing-amount" value="${amount}">
    <input class="ing-unit" value="${unit}">
    <input class="ing-name" value="${name}">
    <button class="delete-ingredient">×</button>
  `;

  row.querySelector(".delete-ingredient").onclick = () => row.remove();
  container.appendChild(row);
}

/* ---------- SAVE ---------- */

async function saveRecipe() {
  const title = document.getElementById("recipeName").value.trim();
  if (!title) return alert("Recipe needs a name");

  const tags = [...document.querySelectorAll(".tag-pill")].map(p => p.dataset.tag);
  const ingredients = [...document.querySelectorAll(".ingredient-row")]
    .map(r => ({
      amount: parseFloat(r.querySelector(".ing-amount").value) || "",
      unit: r.querySelector(".ing-unit").value.trim(),
      name: r.querySelector(".ing-name").value.trim()
    }))
    .filter(i => i.name);

  const data = {
    title,
    tags,
    ingredients,
    cookingTime: document.getElementById("cookingTime").value,
    ovenTemp: document.getElementById("ovenTemp").value,
    servings: document.getElementById("servings").value,
    instructions: document.getElementById("instructions").value
  };

  if (editingId) {
    await FirebaseService.updateRecipe(editingId, data);
  } else {
    await FirebaseService.addRecipe(data);
  }

  window.location.href = "recipes.html";
}
