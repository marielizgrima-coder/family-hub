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
   INGREDIENTS
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
            <option value="clove">clove</option>      <!-- garlic -->
            <option value="stick">stick</option>      <!-- celery, cinnamon -->
            <option value="slice">slice</option>      <!-- bread, cheese -->
            <option value="head">head</option>        <!-- lettuce, cabbage -->
            <option value="bunch">bunch</option>      <!-- parsley, spinach -->
            <option value="can">can</option>          <!-- canned goods -->
            <option value="packet">packet</option>    <!-- noodles, spices -->
        </select>

        <input type="text" class="ing-name" placeholder="Ingredient" value="${name}">
        <button class="delete-ingredient" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(row);

    // Set initial unit if editing
    if (unit) {
        row.querySelector(".ing-unit").value = unit;
    }

    // Conversion logic
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
    });
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

/* ---------------------------------------------------------
   EDIT RECIPE – BASIC STRUCTURE
   (adapt selectors to your existing HTML)
--------------------------------------------------------- */

const fractionUnits = ["cup", "tsp", "tbsp", "piece", "item", "whole"];

const FRACTIONS_F3 = [
    { label: "⅛", value: 0.125 },
    { label: "¼", value: 0.25 },
    { label: "⅓", value: 0.333 },
    { label: "⅜", value: 0.375 },
    { label: "½", value: 0.5 },
    { label: "⅝", value: 0.625 },
    { label: "⅔", value: 0.666 },
    { label: "¾", value: 0.75 },
    { label: "⅞", value: 0.875 },
    { label: "1", value: 1 },
    { label: "1 ¼", value: 1.25 },
    { label: "1 ½", value: 1.5 },
    { label: "1 ¾", value: 1.75 },
    { label: "2", value: 2 }
];

/* ---------------------------------------------------------
   INITIALISATION
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initIngredientRows();
    loadRecipeForEdit();   // if you already have this, keep your version
});

/* ---------------------------------------------------------
   INGREDIENT ROW HANDLING
--------------------------------------------------------- */

function initIngredientRows() {
    const rows = document.querySelectorAll(".ingredient-row");
    rows.forEach(setupIngredientRow);
}

function setupIngredientRow(row) {
    const amountInput = row.querySelector(".ingredient-amount");
    const unitSelect = row.querySelector(".ingredient-unit");

    if (!amountInput || !unitSelect) return;

    // Ensure amount input is numeric with decimals
    amountInput.type = "number";
    amountInput.step = "0.01";
    amountInput.min = "0";

    // Create fraction picker button + select
    let fractionWrapper = row.querySelector(".fraction-wrapper");
    if (!fractionWrapper) {
        fractionWrapper = document.createElement("div");
        fractionWrapper.classList.add("fraction-wrapper");

        const fractionButton = document.createElement("button");
        fractionButton.type = "button";
        fractionButton.classList.add("fraction-button");
        fractionButton.textContent = "Pick fraction";

        const fractionSelect = document.createElement("select");
        fractionSelect.classList.add("fraction-select");
        fractionSelect.innerHTML = `<option value="">Select…</option>` +
            FRACTIONS_F3.map(f => `<option value="${f.value}">${f.label}</option>`).join("");

        fractionWrapper.appendChild(fractionButton);
        fractionWrapper.appendChild(fractionSelect);
        amountInput.insertAdjacentElement("afterend", fractionWrapper);

        // Button toggles visibility of the select (simple behaviour)
        fractionButton.addEventListener("click", () => {
            fractionSelect.classList.toggle("visible");
        });

        // When a fraction is chosen, set the numeric amount
        fractionSelect.addEventListener("change", () => {
            const val = parseFloat(fractionSelect.value);
            if (!isNaN(val)) {
                amountInput.value = val;
            }
        });
    }

    // Show/hide fraction picker based on unit
    function updateFractionVisibility() {
        const unit = unitSelect.value;
        if (fractionUnits.includes(unit)) {
            fractionWrapper.style.display = "inline-flex";
        } else {
            fractionWrapper.style.display = "none";
        }
    }

    unitSelect.addEventListener("change", updateFractionVisibility);
    updateFractionVisibility();
}

/* ---------------------------------------------------------
   SAVE / LOAD RECIPE (SKELETON – MERGE WITH YOUR EXISTING LOGIC)
--------------------------------------------------------- */

function loadRecipeForEdit() {
    // Your existing logic to load a recipe by ID and populate:
    // - title
    // - ingredients (amount, unit, name)
    // After you create rows, call initIngredientRows() again if needed.
}

function collectRecipeData() {
    const ingredients = [];
    document.querySelectorAll(".ingredient-row").forEach(row => {
        const amountInput = row.querySelector(".ingredient-amount");
        const unitSelect = row.querySelector(".ingredient-unit");
        const nameInput = row.querySelector(".ingredient-name");

        if (!nameInput || !nameInput.value.trim()) return;

        ingredients.push({
            amount: amountInput.value ? parseFloat(amountInput.value) : null,
            unit: unitSelect.value || "",
            name: nameInput.value.trim()
        });
    });

    // Return full recipe object (merge with your existing fields)
    return {
        // id, title, etc...
        ingredients
    };
}

function saveRecipe() {
    const recipe = collectRecipeData();
    // Your existing StorageService save logic here
}
