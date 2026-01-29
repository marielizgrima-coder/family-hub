/* ---------------------------------------------------------
   EDIT / ADD RECIPE PAGE
--------------------------------------------------------- */

let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadExistingTags();

    // Add placeholder AFTER loadExistingTags creates the select element
    const select = document.getElementById("existingTags");

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select Tag --";
    placeholder.disabled = true;
    placeholder.selected = true;

    // Insert placeholder at the top
    select.insertBefore(placeholder, select.firstChild);

    checkIfEditing();
});

/* Fraction*/
const fractionUnits = ["cup", "tsp", "tbsp", "piece", "item", "whole"];


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

    document.getElementById("recipeName").value = recipe.title;

    // Tags
    (recipe.tags || []).forEach(tag => addTagPill(tag));

    // Ingredients
    (recipe.ingredients || []).forEach(ing => {
        addIngredientRow(ing.amount, ing.unit, ing.name);
    });

    // Cooking info
    document.getElementById("cookingTime").textContent =
       formatCookingTime(recipe.cookingTime);
    document.getElementById("ovenTemp").textContent =
       recipe.ovenTemp ? `${recipe.ovenTemp}°C` : "-";
    document.getElementById("servings").value = recipe.servings;

    // Instructions
    document.getElementById("instructions").value = recipe.instructions;

    // Favourite
    const favBtn = document.getElementById("favBtn");
    favBtn.classList.toggle("active", recipe.isFavorite);
    favBtn.textContent = recipe.isFavorite ? "⭐" : "☆";
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

    // Reset dropdown to placeholder
    select.value = "";
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
   INGREDIENT ROWS
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
        </select>

        <input type="text" class="ing-name" placeholder="Ingredient" value="${name}">
        <button class="delete-btn" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(row);

    if (unit) row.querySelector(".ing-unit").value = unit;
   
   // Add fraction picker UI
   addFractionPicker(row);
   
   // Show/hide based on current unit
   updateFractionPicker(row);
   
   // Update visibility when unit changes
   row.querySelector(".ing-unit").addEventListener("change", () => {
       updateFractionPicker(row);
   });

}

/* Fraction Logic*/
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

    fractions.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.value;
        opt.textContent = f.label;
        select.appendChild(opt);
    });

    select.addEventListener("change", () => {
        const amountInput = row.querySelector(".ing-amount");
        amountInput.value = select.value;
    });

    wrapper.appendChild(select);
    row.appendChild(wrapper);
}


/* ---------------------------------------------------------
   FAVOURITE
--------------------------------------------------------- */
function toggleFavorite() {
    const isFav = StorageService.toggleFavorite(editingId);

    const favBtn = document.getElementById("favBtn");
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "⭐" : "☆";
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
    const title = document.getElementById("recipeName").value.trim();
    if (!title) {
        alert("Recipe must have a name.");
        return;
    }

    const tags = [...document.querySelectorAll("#tagContainer .tag-pill")]
        .map(p => p.dataset.tag);

    const ingredients = [...document.querySelectorAll(".ingredient-row")]
        .map(row => ({
            amount: row.querySelector(".ing-amount").value.trim(),
            unit: row.querySelector(".ing-unit").value.trim(),
            name: row.querySelector(".ing-name").value.trim()
        }))
        .filter(ing => ing.name !== "");

    const recipeData = {
        title,
        tags,
        ingredients,
        cookingTime: parseInt(document.getElementById("cookingTime").value, 10) || 0,
        ovenTemp: parseInt(document.getElementById("ovenTemp").value, 10) || 0,
        servings: document.getElementById("servings").value.trim(),
        instructions: document.getElementById("instructions").value.trim()
    };

    if (editingId) {
        StorageService.updateRecipe(editingId, recipeData);
    } else {
        StorageService.addRecipe(recipeData);
    }

    window.location.href = "recipes.html";
}


/* Fraction Visibility */ 
function updateFractionPicker(row) {
    const unit = row.querySelector(".ing-unit").value;
    const wrapper = row.querySelector(".fraction-wrapper");

    if (unit && fractionUnits.includes(unit)) {
        wrapper.style.display = "inline-flex";
    } else {
        wrapper.style.display = "none";
    }
}

/* ---------------------------------------------------------
   Cooking Time
--------------------------------------------------------- */
function formatCookingTime(value) {
    const mins = parseInt(value, 10);
    if (isNaN(mins) || mins <= 0) return "-";

    if (mins < 60) return `${mins} mins`;

    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;

    if (remaining === 0) {
        return hours === 1 ? "1 hr" : `${hours} hrs`;
    }

    return hours === 1
        ? `1 hr ${remaining} mins`
        : `${hours} hrs ${remaining} mins`;
}
