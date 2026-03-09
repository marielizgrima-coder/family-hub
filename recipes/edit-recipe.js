/* =====================================================
   GLOBAL STATE
===================================================== */

let editingId = null;
let ingredientList = [];

/* =====================================================
   CONSTANTS
===================================================== */

const MEASUREMENT_UNITS = [
  "",
  "tsp",
  "tbsp",
  "cup",
  "ml",
  "l",
  "g",
  "kg",
  "oz",
  "lb",
  "pinch",
  "clove",
  "piece"
];

/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadExistingTags();
  await loadIngredients();
  checkIfEditing();
});

/* =====================================================
   TAGS
===================================================== */

async function loadExistingTags() {
  const select = document.getElementById("tags");
  if (!select) return;

  select.innerHTML = `<option value="">Select tag</option>`;

  const tags = await FirebaseService.tags();

  tags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  });
}

function addExistingTag() {
  const select = document.getElementById("tags");
  if (!select || !select.value) return;

  addTagPill(select.value);
  select.value = "";
}

async function addNewTag() {
  const input = document.getElementById("newTagInput");
  if (!input) return;

  const tag = input.value.trim();
  if (!tag) return;

  await FirebaseService.addTag(tag);
  addTagPill(tag);

  input.value = "";

  await loadExistingTags();
}

function addTagPill(tag) {
  const container = document.getElementById("tags");
  if (!container) return;

  const exists = [...container.children].some(
    p => p.dataset.tag?.toLowerCase() === tag.toLowerCase()
  );

  if (exists) return;

  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.dataset.tag = tag;

  const remove = document.createElement("span");
  remove.className = "remove-tag";
  remove.textContent = "×";
  remove.onclick = () => pill.remove();

  pill.append(tag + " ");
  pill.appendChild(remove);

  container.appendChild(pill);
}

/* =====================================================
   INGREDIENT DATABASE (AUTOCOMPLETE)
===================================================== */

async function loadIngredients() {
  ingredientList = await FirebaseService.ingredients();
  buildIngredientDatalist();
}

function buildIngredientDatalist() {
  const old = document.getElementById("ingredientsList");
  if (old) old.remove();

  const datalist = document.createElement("datalist");
  datalist.id = "ingredientsList";

  ingredientList.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);
  });

  document.body.appendChild(datalist);
}

async function ensureIngredientExists(name) {
  if (!name) return;

  if (!ingredientList.includes(name)) {
    ingredientList.push(name);
    await FirebaseService.addIngredient(name);
    buildIngredientDatalist();
  }
}

/* =====================================================
   EDIT MODE
===================================================== */

function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");

  if (editingId) loadRecipeData(editingId);
  else addIngredientRow();
}

async function loadRecipeData(id) {
  const recipe = await FirebaseService.recipes(id);
  if (!recipe) return;

  document.getElementById("pageTitle").textContent = "Edit Recipe";
  document.getElementById("recipeName").value = recipe.title || "";

  (recipe.tags || []).forEach(addTagPill);

  if (recipe.ingredients?.length) {
    recipe.ingredients.forEach(i =>
      addIngredientRow(i.amount, i.unit, i.name)
    );
  } else {
    addIngredientRow();
  }

  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";
  document.getElementById("instructions").value = recipe.instructions || "";

  setupFavoriteButton(id, recipe.isFavorite);
  setupDeleteButton(id);
}

/* =====================================================
   FAVORITE BUTTON
===================================================== */

function setupFavoriteButton(id, isFavorite) {
  const btn = document.getElementById("favBtn");
  if (!btn) return;

  btn.classList.toggle("active", isFavorite);
  btn.textContent = isFavorite ? "★" : "☆";

  btn.onclick = async () => {
    const next = await FirebaseService.toggleFavorite(id);
    btn.classList.toggle("active", next);
    btn.textContent = next ? "★" : "☆";
  };
}

/* =====================================================
   DELETE BUTTON
===================================================== */

function setupDeleteButton(id) {
  const btn = document.getElementById("deleteBtn");
  if (!btn) return;

  btn.style.display = "";

  btn.onclick = async () => {
    if (!confirm("Delete this recipe?")) return;

    await FirebaseService.deleteRecipe(id);
    window.location.href = "recipes.html";
  };
}

/* =====================================================
   INGREDIENT ROWS
===================================================== */

function createMeasurementSelect(value = "") {
  const select = document.createElement("select");
  select.className = "ing-unit";

  MEASUREMENT_UNITS.forEach(unit => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit || "unit";
    select.appendChild(option);
  });

  if (value) select.value = value;

  return select;
}

function addIngredientRow(amount = "", unit = "", name = "") {
  const container = document.getElementById("ingredients");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "ingredient-row";

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.className = "ing-amount";
  amountInput.placeholder = "Amount";
  amountInput.min = "0";
  amountInput.step = "any";
  amountInput.value = amount;

  const unitSelect = createMeasurementSelect(unit);

  const nameInput = document.createElement("input");
  nameInput.className = "ing-name";
  nameInput.placeholder = "Ingredient";
  nameInput.setAttribute("list", "ingredientsList");
  nameInput.value = name;

  const del = document.createElement("button");
  del.className = "delete-ingredient";
  del.textContent = "×";
  del.onclick = () => row.remove();

  row.appendChild(amountInput);
  row.appendChild(unitSelect);
  row.appendChild(nameInput);
  row.appendChild(del);

  container.appendChild(row);
}

/* =====================================================
   MULTIPLIER
===================================================== */

function applyMultiplier(multiplier) {
  document.querySelectorAll(".ingredient-row").forEach(row => {
    const el = row.querySelector(".ing-amount");

    const value = parseFloat(el.value);
    if (isNaN(value)) return;

    const next = value * multiplier;

    el.value = Math.max(0, next)
      .toFixed(2)
      .replace(/\.00$/, "");
  });
}

/* =====================================================
   SAVE RECIPE
===================================================== */

async function saveRecipe() {
  const titleInput = document.getElementById("recipeName");
  const saveBtn = document.querySelector(".save-btn");

  const title = titleInput?.value.trim();
  if (!title) return alert("Recipe needs a name");

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const tags = [...document.querySelectorAll(".tag-pill")].map(
      p => p.dataset.tag
    );

    const ingredients = [];

    for (const row of document.querySelectorAll(".ingredient-row")) {
      const amountVal = row.querySelector(".ing-amount").value;
      const parsed = amountVal === "" ? "" : parseFloat(amountVal);

      const item = {
        amount: Number.isNaN(parsed) ? "" : Math.max(0, parsed),
        unit: row.querySelector(".ing-unit").value.trim(),
        name: row.querySelector(".ing-name").value.trim()
      };

      if (item.name) {
        await ensureIngredientExists(item.name);
        ingredients.push(item);
      }
    }

    const cookingTime = parseInt(
      document.getElementById("cookingTime").value,
      10
    );

    const ovenTemp = parseInt(
      document.getElementById("ovenTemp").value,
      10
    );

    const servings = document.getElementById("servings").value;

    const data = {
      title,
      tags,
      ingredients,
      cookingTime: Number.isNaN(cookingTime) ? "" : cookingTime,
      ovenTemp: Number.isNaN(ovenTemp) ? "" : ovenTemp,
      servings,
      instructions: document.getElementById("instructions").value
    };

    for (const tag of tags) {
      await FirebaseService.addTag(tag);
    }

    if (editingId) {
      await FirebaseService.updateRecipe(editingId, data);
    } else {
      await FirebaseService.addRecipe(data);
    }

    window.location.href = "recipes.html";
  } catch (err) {
    console.error(err);
    alert("Failed to save recipe.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Recipe";
  }
}
