/* ---------------------------------------------------------
   LOAD ALL RECIPES + RENDER CARDS
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    loadRecipes();
});

function loadRecipes() {
    const recipes = StorageService.getAllRecipes();
    const list = document.getElementById("recipesList");

    list.innerHTML = "";

    if (recipes.length === 0) {
        list.innerHTML = `<p>No recipes yet. Click "Add Recipe" to create one!</p>`;
        return;
    }

    recipes
    .filter(filterRecipe)
    .forEach(recipe => {
        const card = document.createElement("div");
        card.classList.add("recipe-card");

        card.innerHTML = `
            <h3>${recipe.title}</h3>
            <p class="recipe-tags">${renderTagList(recipe.tags)}</p>
            <button class="small-btn" onclick="openRecipe('${recipe.id}')">View</button>
        `;

        list.appendChild(card);
    });
}

function renderTagList(tags = []) {
    if (!tags.length) return "No tags";
    return tags.map(t => `<span class="tag-pill">${t}</span>`).join(" ");
}

function openRecipe(id) {
    window.location.href = `view-recipe.html?id=${id}`;
}


/* ---------------------------------------------------------
   FILTER SYSTEM
--------------------------------------------------------- */

let activeFilters = {
    mode: "all", // "all", "favourites", or "tags"
    tags: []
};

function initFilters() {
    const filterBar = document.getElementById("filterBar");
    filterBar.innerHTML = "";

    // All button
    createFilterButton("All", "all", filterBar);

    // Favourites button
    createFilterButton("Favourites", "favourites", filterBar);

    // Tag buttons
    const tags = StorageService.getTags();
    tags.forEach(tag => createFilterButton(tag, "tag", filterBar));

    updateFilterUI();
}

function createFilterButton(label, type, container) {
    const btn = document.createElement("button");
    btn.classList.add("filter-btn");
    btn.textContent = label;

    btn.addEventListener("click", () => {
        if (type === "all") {
            activeFilters.mode = "all";
            activeFilters.tags = [];
        } 
        else if (type === "favourites") {
            activeFilters.mode = "favourites";
            activeFilters.tags = [];
        } 
        else if (type === "tag") {
            // Switch to tag mode
            if (activeFilters.mode !== "tags") {
                activeFilters.mode = "tags";
                activeFilters.tags = [];
            }

            // Toggle tag
            if (activeFilters.tags.includes(label)) {
                activeFilters.tags = activeFilters.tags.filter(t => t !== label);
            } else {
                activeFilters.tags.push(label);
            }

            // If no tags left, revert to "all"
            if (activeFilters.tags.length === 0) {
                activeFilters.mode = "all";
            }
        }

        updateFilterUI();
        renderRecipes();
    });

    container.appendChild(btn);
}

function updateFilterUI() {
    const buttons = document.querySelectorAll(".filter-btn");

    buttons.forEach(btn => {
        btn.classList.remove("active");

        if (btn.textContent === "All" && activeFilters.mode === "all") {
            btn.classList.add("active");
        }

        if (btn.textContent === "Favourites" && activeFilters.mode === "favourites") {
            btn.classList.add("active");
        }

        if (activeFilters.mode === "tags" && activeFilters.tags.includes(btn.textContent)) {
            btn.classList.add("active");
        }
    });
}

function filterRecipe(recipe) {
    if (activeFilters.mode === "all") {
        return true;
    }

    if (activeFilters.mode === "favourites") {
        return recipe.favourite === true;
    }

    if (activeFilters.mode === "tags") {
        return activeFilters.tags.every(tag => recipe.tags?.includes(tag));
    }

    return true;
}


