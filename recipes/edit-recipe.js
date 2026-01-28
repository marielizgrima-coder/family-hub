/* ---------------------------------------------------------
   EDIT / ADD RECIPE PAGE
--------------------------------------------------------- */

let editingId = null; // null = adding new recipe

document.addEventListener("DOMContentLoaded", () => {
    loadExistingTags();
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
        loadRecipeData(editingId);
    }
}

/* ---------------------------------------------------------
   LOAD EXISTING RECIPE INTO FORM
--------------------------------------------------------- */

function loadRecipeData(id) {
    const recipe = StorageService.getRecipe(id);
    if (!recipe) return;

    document.getElementById("recipeName").value = recipe.title || "";

    // Tags
    recipe.tags?.forEach(tag => addTagPill(tag));

    // Ingredients
    recipe.ingredients?.forEach(ing => {
        addIngredientRow(ing.amount, ing.unit, ing.name);
    });

    // Cooking info
    document.getElementById("cookingTime").value = recipe.cookingTime || "";
    document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
    document.getElementById("servings").value = recipe.servings || "";

    // Instructions
    document.getElementById("instructions").value = recipe.instructions || "";
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

function addExistingTag(tag) {
    if (!tag) return;
    addTagPill(tag);
    document.getElementById("existingTags").value = "";
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

    // Prevent duplicates
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
   INGREDIENTS
--------------------------------------------------------- */

function addIngredientRow(amount = "", unit = "", name = "") {
    const container = document.getElementById("ingredientsContainer");

    const row = document.createElement("div");
    row.classList.add("ingredient-row");

    row.innerHTML = `
        <input type="text" class="ing-amount" placeholder="Amt" value="${amount}">
        <input type="text" class="ing-unit" placeholder="Unit" value="${unit}">
        <input type="text" class="ing-name" placeholder="Ingredient" value="${name}">
        <button class="delete-ingredient" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(row);
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

    // Tags
    const tags = [...document.querySelectorAll("#tagContainer .tag-pill")]
        .map(p => p.dataset.tag);

    // Ingredients
    const ingredients = [...document.querySelectorAll(".ingredient-row")].map(row => ({
        amount: row.querySelector(".ing-amount").value.trim(),
        unit: row.querySelector(".ing-unit").value.trim(),
        name: row.querySelector(".ing-name").value.trim()
    })).filter(ing => ing.name !== "");

    const recipeData = {
        title,
        tags,
        ingredients,
        cookingTime: document.getElementById("cookingTime").value.trim(),
        ovenTemp: document.getElementById("ovenTemp").value.trim(),
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

