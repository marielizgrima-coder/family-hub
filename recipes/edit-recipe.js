/* =========================================================
   RECIPE EDITOR
   Handles:
   - Loading tags
   - Adding tags
   - Editing recipes
   - Ingredients
   - Saving recipes
   ========================================================= */

let editingId = null;

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

/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadExistingTags();
  checkIfEditing();
});

/* =========================================================
   TAGS
   ========================================================= */

async function loadExistingTags() {
  const select = document.getElementById("tags");
  if (!select) return;

  select.innerHTML = `<option value="">Select tag</option>`;

  const tags = await FirebaseService.tags();

  tags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    select.appendChild(option);
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

  const select = document.getElementById("tags");
  if (select) select.value = tag;
}

function addTagPill(tag) {
  const container = document.getElementById("tags");
  if (!container) return;

  const exists = [...container.children].some(
    pill => pill.dataset.tag?.toLowerCase() === tag.toLowerCase()
  );

  if (exists) return;

  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.dataset.tag = tag;

  const removeBtn = document.createElement("span");
  removeBtn.className = "remove-tag";
  removeBtn.textContent = "×";
  removeBtn.onclick = () => pill.remove();

  pill.append(tag + " ");
  pill.appendChild(removeBtn);

  container.appendChild(pill);
}

/* =========================================================
   EDIT MODE
   ========================================================= */

function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");

  if (editingId) {
    loadRecipeData(editingId);
  } else {
    addIngredientRow();
  }
}

async function loadRecipeData(id) {
  const recipe = await FirebaseService.recipes(id);
  if (!recipe) return;

  document.getElementById("pageTitle").textContent = "Edit Recipe";
  document.getElementById("recipeName").value = recipe.title || "";

  /* Load tags */
  (recipe.tags || []).forEach(addTagPill);

  /* Load ingredients */
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    recipe.ingredients.forEach(i =>
      addIngredientRow(i.amount, i.unit, i.name)
    );
  } else {
    addIngredientRow();
  }

  /* Other fields */
  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";
  document.getElementById("instructions").value = recipe.instructions || "";

  setupFavoriteButton(id, recipe.isFavorite);
  setupDeleteButton(id);
}

/* =========================================================
   FAVORITE BUTTON
   ========================================================= */

function setupFavoriteButton(id, isFavorite) {
  const favBtn = document.getElementById("favBtn");
  if (!favBtn) return;

  favBtn.classList.toggle("active", isFavorite);
  favBtn.textContent = isFavorite ? "★" : "☆";

  favBtn.onclick = async () => {
    const newValue = await FirebaseService.toggleFavorite(id);

    favBtn.classList.toggle("active", newValue);
    favBtn.textContent = newValue ? "★" : "☆";
  };
}

/* =========================================================
   DELETE BUTTON
   ========================================================= */

function setupDeleteButton(id) {
  const deleteBtn = document.getElementById("deleteBtn");
  if (!deleteBtn) return;

  deleteBtn.style.display = "";

  deleteBtn.onclick = async () => {
    if (!confirm("Delete this recipe?")) return;

    try {
      await FirebaseService.deleteRecipe(id);
      window.location.href = "recipes.html";
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete recipe.");
    }
  };
}

/* =========================================================
   INGREDIENTS
   ========================================================= */

function createMeasurementSelect(value = "") {
  const select = document.createElement("select");
  select.className = "ing-unit";

  MEASUREMENT_UNITS.forEach(unit => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit || "unit";
    select.appendChild(option);
  });

  if (MEASUREMENT_UNITS.includes(value)) {
    select.value = value;
  }

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
  amountInput.value = amount === "" ? "" : amount;
  amountInput.min = "0";
  amountInput.step = "any";

  amountInput.addEventListener("input", () => {
    if (parseFloat(amountInput.value) < 0) {
      amountInput.value = "0";
    }
  });

  const unitSelect = createMeasurementSelect(unit);

  const nameInput = document.createElement("input");
  nameInput.className = "ing-name";
  nameInput.placeholder = "Ingredient";
  nameInput.value = name || "";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-ingredient";
  deleteBtn.textContent = "×";
  deleteBtn.onclick = () => row.remove();

  row.appendChild(amountInput);
  row.appendChild(unitSelect);
  row.appendChild(nameInput);
  row.appendChild(deleteBtn);

  container.appendChild(row);
}

/* =========================================================
   MULTIPLIER
   ========================================================= */

function applyMultiplier(multiplier) {
  document.querySelectorAll(".ingredient-row").forEach(row => {
    const amountEl = row.querySelector(".ing-amount");
    if (!amountEl) return;

    const value = parseFloat(amountEl.value);
    if (isNaN(value)) return;

    const next = value * multiplier;

    amountEl.value = Math.max(0, next)
      .toFixed(2)
      .replace(/\.00$/, "");
  });
}

/* =========================================================
   SAVE RECIPE
   ========================================================= */

async function saveRecipe() {
  const titleInput = document.getElementById("recipeName");
  const saveBtn = document.querySelector(".save-btn");

  const title = titleInput?.value.trim();
  if (!title) return alert("Recipe needs a name");

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {
    const tags = [...document.querySelectorAll(".tag-pill")].map(
      pill => pill.dataset.tag
    );

    const ingredients = [...document.querySelectorAll(".ingredient-row")]
      .map(row => {
        const amountVal = row.querySelector(".ing-amount").value;

        const parsed = amountVal === "" ? "" : parseFloat(amountVal);
        const amount = Number.isNaN(parsed) ? "" : Math.max(0, parsed);

        return {
          amount,
          unit: row.querySelector(".ing-unit").value.trim(),
          name: row.querySelector(".ing-name").value.trim()
        };
      })
      .filter(i => i.name);

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
      cookingTime: Number.isNaN(cookingTime) ? "" : Math.max(0, cookingTime),
      ovenTemp: Number.isNaN(ovenTemp) ? "" : Math.max(0, ovenTemp),
      servings,
      instructions: document.getElementById("instructions").value
    };

    /* Ensure tags exist */
    for (const tag of tags) {
      await FirebaseService.addTag(tag);
    }

    /* Save ingredients for autocomplete database */
    await FirebaseService.saveIngredients(ingredients);

    if (editingId) {
      await FirebaseService.updateRecipe(editingId, data);
    } else {
      await FirebaseService.addRecipe(data);
    }

    window.location.href = "recipes.html";
  } catch (err) {
    console.error("Failed to save recipe:", err);
    alert("Failed to save recipe.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Recipe";
    }
  }
}
