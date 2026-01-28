/* ---------------------------------------------------------
   EDIT / ADD RECIPE PAGE — CLEAN + FIXED + UNIFIED
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
   UNIT CONVERSION
--------------------------------------------------------- */
function convertUnit(amount, from, to) {
    const value = parseFloat(amount);
    if (isNaN(value)) return amount;

    const table = {
        g: { kg: value / 1000 },
        kg: { g: value * 1000 },

        ml: { l: value / 1000 },
        l: { ml: value * 1000 },

        oz: { lb: value / 16 },
        lb: { oz: value * 16 },

        tsp: { tbsp: value / 3, cup: value / 48 },
        tbsp: { tsp: value * 3, cup: value / 16 },
        cup: { tbsp: value * 16, tsp: value * 48 }
    };

    return table[from]?.[to] ?? value;
}

/* ---------------------------------------------------------
   INGREDIENT ROWS
--------------------------------------------------------- */

const fractionUnits = ["cup", "tsp", "tbsp", "piece", "item", "whole"];

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
            <option value="clove">clove</option>
            <option value="stick">stick</option>
            <option value="slice">slice</option>
            <option value="head">head</option>
            <option value="bunch">bunch</option>
            <option value="can">can</option>
            <option value="packet">packet</option>
        </select>

        <input type="text" class="ing-name" placeholder="Ingredient" value="${name}">
        <button class="delete-ingredient" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(row);

    // Set initial unit
    if (unit) row.querySelector(".ing-unit").value = unit;

    // Unit conversion + fraction picker
    const unitSelect = row.querySelector(".ing-unit");
    const amountInput = row.querySelector(".ing-amount");
    let previousUnit = unit;

    unitSelect.addEventListener("change", () => {
        const newUnit = unitSelect.value;

        if (previousUnit && newUnit && previousUnit !== newUnit) {
            const newAmount = convertUnit(amountInput.value, previousUnit, newUnit);
            amountInput.value = Math.round(newAmount * 100) / 100;
        }

        previousUnit = newUnit;
        updateFractionPicker(row);
    });

    // Fraction picker
    addFractionPicker(row);
    updateFractionPicker(row);
}

/* ---------------------------------------------------------
   FRACTION PICKER
--------------------------------------------------------- */
function addFractionPicker(row) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("fraction-wrapper");
    wrapper.style.display = "none";

    const select = document.createElement("select");
    select.classList.add("fraction-select");

    [
        { label: "¼", value: 0.25 },
        { label: "½", value: 0.5 },
        { label: "¾", value: 0.75 }
    ].forEach(f => {
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
