let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExistingTags();
  checkIfEditing();
});

/* ---------- TAGS ---------- */

async function loadExistingTags() {
  const select = document.getElementById("existingTags");
  if (!select) return;

  select.innerHTML = `<option value="">Select tag</option>`;
  const tags = await FirebaseService.getTags();

  tags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  });
}

async function addExistingTag() {
  const select = document.getElementById("existingTags");
  if (select.value) addTagPill(select.value);
  select.value = "";
}

async function addNewTag() {
  const input = document.getElementById("newTagInput");
  const tag = input.value.trim();
  if (!tag) return;

  await FirebaseService.addTag(tag);
  addTagPill(tag);
  input.value = "";
  loadExistingTags();
}

function addTagPill(tag) {
  const container = document.getElementById("tagContainer");
  if ([...container.children].some(p => p.dataset.tag === tag)) return;

  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.dataset.tag = tag;
  pill.innerHTML = `${tag} <span class="remove-tag">×</span>`;
  pill.querySelector(".remove-tag").onclick = () => pill.remove();
  container.appendChild(pill);
}

/* ---------- EDIT MODE ---------- */

function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id");
  if (editingId) loadRecipeData(editingId);
}

async function loadRecipeData(id) {
  const recipe = await FirebaseService.getRecipe(id);
  if (!recipe) return;

  document.getElementById("pageTitle").textContent = "Edit Recipe";
  document.getElementById("recipeName").value = recipe.title || "";

  (recipe.tags || []).forEach(addTagPill);
  (recipe.ingredients || []).forEach(i => addIngredientRow(i.amount, i.unit, i.name));

  document.getElementById("cookingTime").value = recipe.cookingTime || "";
  document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
  document.getElementById("servings").value = recipe.servings || "";
  document.getElementById("instructions").value = recipe.instructions || "";

  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.style.display = "";
    deleteBtn.onclick = async () => {
      if (!confirm("Delete this recipe?")) return;
      try {
        await FirebaseService.deleteRecipe(id);
        window.location.href = "recipes.html";
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete recipe. See console for details.");
      }
    };
  }
}

/* ---------- INGREDIENTS ---------- */

function addIngredientRow(amount = "", unit = "", name = "") {
  const container = document.getElementById("ingredientsContainer");
  const row = document.createElement("div");
  row.className = "ingredient-row";

  const safeAmount = amount === "" ? "" : amount;
  const safeUnit = (unit || "").replace(/"/g, "&quot;");
  const safeName = (name || "").replace(/"/g, "&quot;");

  row.innerHTML = `
    <input type="number" class="ing-amount" value="${safeAmount}">
    <input class="ing-unit" value="${safeUnit}">
    <input class="ing-name" value="${safeName}">
    <button class="delete-ingredient">×</button>
  `;

  row.querySelector(".delete-ingredient").onclick = () => row.remove();
  container.appendChild(row);
}

/* ---------- SAVE ---------- */

async function saveRecipe() {
  const titleEl = document.getElementById("recipeName");
  const saveBtn = document.querySelector(".save-btn");

  const title = titleEl ? titleEl.value.trim() : "";
  if (!title) return alert("Recipe needs a name");

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {
    const tags = [...document.querySelectorAll(".tag-pill")].map(p => p.dataset.tag);
    const ingredients = [...document.querySelectorAll(".ingredient-row")]
      .map(r => {
        const amountVal = r.querySelector(".ing-amount").value;
        const amount = amountVal === "" ? "" : parseFloat(amountVal);
        return {
          amount: Number.isNaN(amount) ? "" : amount,
          unit: r.querySelector(".ing-unit").value.trim(),
          name: r.querySelector(".ing-name").value.trim()
        };
      })
      .filter(i => i.name);

    const cookingTimeRaw = document.getElementById("cookingTime").value;
    const cookingTime = cookingTimeRaw === "" ? "" : parseInt(cookingTimeRaw, 10);
    const ovenTempRaw = document.getElementById("ovenTemp").value;
    const ovenTemp = ovenTempRaw === "" ? "" : parseInt(ovenTempRaw, 10);
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

    if (editingId) {
      await FirebaseService.updateRecipe(editingId, data);
      console.log("Recipe updated:", editingId, data);
    } else {
      const newId = await FirebaseService.addRecipe(data);
      console.log("Recipe added:", newId, data);
    }

    window.location.href = "recipes.html";
  } catch (err) {
    console.error("Failed to save recipe:", err);
    alert("Failed to save recipe. See console for details.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Recipe";
    }
  }
}