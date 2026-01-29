/* ---------------------------------------------------------
   EDIT / ADD RECIPE PAGE
--------------------------------------------------------- */

let editingId = null;

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
    document.getElementById("cookingTime").value = recipe.cookingTime;
    document.getElementById("ovenTemp").value = recipe.ovenTemp;
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

function addExistingTag(tag) {
    if (!tag) return;
    addTagPill(tag);
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
