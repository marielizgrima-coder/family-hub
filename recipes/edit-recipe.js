/* ---------------------------------------------------------
   EDIT / ADD RECIPE PAGE
--------------------------------------------------------- */

let editingId = null;

/* Fraction-friendly units */
const fractionUnits = ["cup", "tsp", "tbsp", "piece", "item", "whole"];

/* Conversion factors (expandable) */
const conversions = {
  cup_to_ml: 240,
  oz_to_g: 28.35,
  lb_to_g: 453.592,
  tbsp_to_ml: 15,
  tsp_to_ml: 5
};

document.addEventListener("DOMContentLoaded", () => {
document.getElementById("favBtn").onclick = toggleFavorite;

  loadExistingTags();
  // insert placeholder after select is populated
  const select = document.getElementById("existingTags");
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select Tag --";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.insertBefore(placeholder, select.firstChild);

  checkIfEditing();
});

/* ---------------------------------------------------------
   CHECK IF EDITING
--------------------------------------------------------- */
function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");

  if (editingId) {
    document.getElementById("pageTitle").textContent = "Edit Recipe";
    document.getElementById("deleteBtn").style.display = "inline-block";
    loadRecipeData(editingId);
  }
}

/* ---------------------------------------------------------
   LOAD EXISTING RECIPE
--------------------------------------------------------- */
function loadRecipeData(id) {
  const recipe = StorageService.getRecipe(id);
  if (!recipe) return;

  document.getElementById("recipeName").value = recipe.title || "";

  // Tags
  (recipe.tags || []).forEach(tag => addTagPill(tag));

  // Ingredients
  (recipe.ingredients || []).forEach(ing => {
    addIngredientRow(ing.amount, ing.unit, ing.name);
  });

  // Cooking info
  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";

  // Instructions
  document.getElementById("instructions").value = recipe.instructions || "";

  // Favourite
  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", recipe.isFavorite);
  favBtn.textContent = recipe.isFavorite ? "☆" : "☆";
  favBtn.onclick = toggleFavorite;

  // Delete
  document.getElementById("deleteBtn").onclick = deleteRecipe;
}

/* ---------------------------------------------------------
   TAGS
--------------------------------------------------------- */
function loadExistingTags() {
  const tags = StorageService.getTags();
  const select = document.getElementById("existingTags");

  // clear then populate
  select.innerHTML = "";
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

  StorageService.addTag(tag);
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

/* ---------------------------------------------------------
   INGREDIENT ROWS (fractions + conversions + multiplier)
--------------------------------------------------------- */
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
    <button class="delete-btn" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(row);

  const unitSelect = row.querySelector(".ing-unit");
  const amountInput = row.querySelector(".ing-amount");

  if (unit) unitSelect.value = unit;

  // Fraction picker
  addFractionPicker(row);
  updateFractionPicker(row);

  unitSelect.addEventListener("change", () => {
    updateFractionPicker(row);
    convertUnits(row);
  });

  amountInput.addEventListener("input", () => convertUnits(row));

  convertUnits(row);
}


/* Fraction UI */
function addFractionPicker(row) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("fraction-wrapper");
  wrapper.style.display = "none";

  const select = document.createElement("select");
  select.classList.add("fraction-select");

  const fractions = [
    { label: "¼", value: 0.25 },
    { label: "½", value: 0.5 },
    { label: "¾", value: 0.75 }
  ];

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "—";
  placeholder.selected = true;
  select.appendChild(placeholder);

  fractions.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.value;
    opt.textContent = f.label;
    select.appendChild(opt);
  });

    select.addEventListener("change", () => {
     const amountInput = row.querySelector(".ing-amount");
     const whole = parseFloat(amountInput.value) || 0;
     const fraction = parseFloat(select.value) || 0;
     amountInput.value = (whole + fraction).toFixed(2).replace(/\.00$/, "");
     select.value = "";
     convertUnits(row);
   });


  wrapper.appendChild(select);
  row.appendChild(wrapper);
}

/* Fraction visibility */
function updateFractionPicker(row) {
  const unit = row.querySelector(".ing-unit").value;
  const wrapper = row.querySelector(".fraction-wrapper");
  if (!wrapper) return;
  wrapper.style.display = fractionUnits.includes(unit) ? "inline-flex" : "none";
}

/* Unit conversion preview (non-destructive) */
function convertUnits(row) {
  const unit = row.querySelector(".ing-unit").value;
  const amount = parseFloat(row.querySelector(".ing-amount").value || 0);
  // Remove existing preview
  const existingPreview = row.querySelector(".conversion-preview");
  if (existingPreview) existingPreview.remove();

  let previewText = "";

  if (unit === "cup") {
    previewText = `${(amount * conversions.cup_to_ml).toFixed(0)} ml`;
  } else if (unit === "oz") {
    previewText = `${(amount * conversions.oz_to_g).toFixed(0)} g`;
  } else if (unit === "lb") {
    previewText = `${(amount * conversions.lb_to_g).toFixed(0)} g`;
  } else if (unit === "tbsp") {
    previewText = `${(amount * conversions.tbsp_to_ml).toFixed(0)} ml`;
  } else if (unit === "tsp") {
    previewText = `${(amount * conversions.tsp_to_ml).toFixed(0)} ml`;
  }

  if (previewText) {
    const preview = document.createElement("div");
    preview.classList.add("conversion-preview");
    preview.style.fontSize = "12px";
    preview.style.color = "#666";
    preview.style.marginLeft = "6px";
    preview.textContent = previewText;
    row.appendChild(preview);
  }
}

/* Apply multiplier to all ingredient amounts */
function applyMultiplier(multiplier) {
  document.querySelectorAll(".ingredient-row").forEach(row => {
    const amountInput = row.querySelector(".ing-amount");
    const current = parseFloat(amountInput.value || 0);
    amountInput.value = (current * multiplier).toFixed(2).replace(/\.00$/, "");
    convertUnits(row);
  });
}

/* ---------------------------------------------------------
   FAVOURITE
--------------------------------------------------------- */
function toggleFavorite() {
  if (!editingId) {
    // If creating new recipe, toggle visual only until saved
    const favBtn = document.getElementById("favBtn");
    const isActive = favBtn.classList.toggle("active");
    favBtn.textContent = isActive ? "☆" : "☆";
    return;
  }

  const isFav = StorageService.toggleFavorite(editingId);
  const favBtn = document.getElementById("favBtn");
  favBtn.classList.toggle("active", isFav);
  favBtn.textContent = isFav ? "☆" : "☆";
}

/* ---------------------------------------------------------
   DELETE RECIPE
--------------------------------------------------------- */
function deleteRecipe() {
  if (!confirm("Delete this recipe?")) return;
  StorageService.deleteRecipe(editingId);
  window.location.href = "recipes.html";
}

/* ---------------------------------------------------------
   SAVE RECIPE
--------------------------------------------------------- */
function saveRecipe() {
 document.getElementById("deleteBtn").style.display = "inline-block";
  const title = document.getElementById("recipeName").value.trim();
  if (!title) {
    alert("Recipe must have a name.");
    return;
  }

  const tags = [...document.querySelectorAll("#tagContainer .tag-pill")].map(p => p.dataset.tag);

   const ingredients = [...document.querySelectorAll(".ingredient-row")]
     .map(row => {
       const amountVal = row.querySelector(".ing-amount").value;
       return {
         amount: amountVal === "" ? "" : parseFloat(amountVal),
         unit: row.querySelector(".ing-unit").value.trim(),
         name: row.querySelector(".ing-name").value.trim()
       };
     })
     .filter(ing => ing.name);


  const cookingTimeVal = parseInt(document.getElementById("cookingTime").value, 10) || 0;
  const ovenTempVal = parseInt(document.getElementById("ovenTemp").value, 10) || 0;

  const recipeData = {
    title,
    tags,
    ingredients,
    cookingTime: cookingTimeVal,
    ovenTemp: ovenTempVal,
    servings: document.getElementById("servings").value.trim(),
    instructions: document.getElementById("instructions").value.trim()
  };

  if (editingId) {
    StorageService.updateRecipe(editingId, recipeData);
  } else {
    const newId = StorageService.addRecipe(recipeData);
    editingId = newId;
  }

  window.location.href = "recipes.html";
}
