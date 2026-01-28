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

    recipes.forEach(recipe => {
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

