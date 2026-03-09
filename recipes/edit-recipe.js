diff --git a/recipes/edit-recipe.js b/recipes/edit-recipe.js
index f8fb0ffb4e0e82ba88ff0ec275541ebc3215965d..ac809b69a76acca2812b815a3fc2b66bce5d7fbc 100644
--- a/recipes/edit-recipe.js
+++ b/recipes/edit-recipe.js
@@ -1,242 +1,299 @@
 let editingId = null;
 
+const MEASUREMENT_UNITS = [
+  "",
+  "tsp",
+  "tbsp",
+  "cup",
+  "ml",
+  "l",
+  "g",
+  "kg",
+  "oz",
+  "lb",
+  "pinch",
+  "clove",
+  "piece"
+];
+
 document.addEventListener("DOMContentLoaded", async () => {
   await loadExistingTags();
   checkIfEditing();
 });
 
 /* ---------- TAGS ---------- */
 
 async function loadExistingTags() {
   const select = document.getElementById("tags");
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
 
 function addExistingTag() {
   const select = document.getElementById("tags");
   if (!select) return;
 
   if (select.value) addTagPill(select.value);
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
-  loadExistingTags();
+  await loadExistingTags();
+
+  const select = document.getElementById("tags");
+  if (select) select.value = tag;
 }
 
 function addTagPill(tag) {
   const container = document.getElementById("tagContainer");
   if (!container) return;
 
-  if ([...container.children].some(p => p.dataset.tag === tag)) return;
+  if ([...container.children].some(p => p.dataset.tag?.toLowerCase() === tag.toLowerCase())) return;
 
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
 
 /* ---------- EDIT MODE ---------- */
 
 function checkIfEditing() {
   const params = new URLSearchParams(window.location.search);
   editingId = params.get("id");
 
-  if (editingId) loadRecipeData(editingId);
+  if (editingId) {
+    loadRecipeData(editingId);
+  } else {
+    addIngredientRow();
+  }
 }
 
 async function loadRecipeData(id) {
   const recipe = await FirebaseService.recipes(id);
   if (!recipe) return;
 
   document.getElementById("pageTitle").textContent = "Edit Recipe";
   document.getElementById("recipeName").value = recipe.title || "";
 
   (recipe.tags || []).forEach(addTagPill);
   (recipe.ingredients || []).forEach(i =>
     addIngredientRow(i.amount, i.unit, i.name)
   );
 
+  if (!recipe.ingredients || recipe.ingredients.length === 0) {
+    addIngredientRow();
+  }
+
   document.getElementById("cookingTime").value = recipe.cookingTime || "";
   document.getElementById("ovenTemp").value = recipe.ovenTemp || "";
   document.getElementById("servings").value = recipe.servings || "";
   document.getElementById("instructions").value = recipe.instructions || "";
 
-  // Favorite toggle
   const favBtn = document.getElementById("favBtn");
   if (favBtn) {
     favBtn.classList.toggle("active", recipe.isFavorite);
     favBtn.textContent = recipe.isFavorite ? "★" : "☆";
 
     favBtn.onclick = async () => {
       const newFav = await FirebaseService.toggleFavorite(id);
       favBtn.classList.toggle("active", newFav);
       favBtn.textContent = newFav ? "★" : "☆";
     };
   }
 
-  // Delete button
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
 
+function createMeasurementSelect(value = "") {
+  const select = document.createElement("select");
+  select.className = "ing-unit";
+
+  MEASUREMENT_UNITS.forEach(unit => {
+    const option = document.createElement("option");
+    option.value = unit;
+    option.textContent = unit || "unit";
+    select.appendChild(option);
+  });
+
+  if (MEASUREMENT_UNITS.includes(value)) {
+    select.value = value;
+  }
+
+  return select;
+}
+
 function addIngredientRow(amount = "", unit = "", name = "") {
   const container = document.getElementById("ingredients");
   if (!container) return;
 
   const row = document.createElement("div");
   row.className = "ingredient-row";
 
   const amountInput = document.createElement("input");
   amountInput.type = "number";
   amountInput.className = "ing-amount";
   amountInput.value = amount === "" ? "" : amount;
+  amountInput.min = "0";
+  amountInput.step = "any";
+  amountInput.placeholder = "Amount";
+  amountInput.addEventListener("input", () => {
+    if (amountInput.value === "") return;
+    if (parseFloat(amountInput.value) < 0) amountInput.value = "0";
+  });
 
-  const unitInput = document.createElement("input");
-  unitInput.className = "ing-unit";
-  unitInput.value = unit || "";
+  const unitInput = createMeasurementSelect(unit || "");
 
   const nameInput = document.createElement("input");
   nameInput.className = "ing-name";
   nameInput.value = name || "";
+  nameInput.placeholder = "Ingredient";
 
   const deleteBtn = document.createElement("button");
   deleteBtn.className = "delete-ingredient";
   deleteBtn.textContent = "×";
   deleteBtn.onclick = () => row.remove();
 
   row.appendChild(amountInput);
   row.appendChild(unitInput);
   row.appendChild(nameInput);
   row.appendChild(deleteBtn);
 
   container.appendChild(row);
 }
 
 /* ---------- MULTIPLIER ---------- */
 
 function applyMultiplier(multiplier) {
   document.querySelectorAll(".ingredient-row").forEach(row => {
     const amountEl = row.querySelector(".ing-amount");
     if (!amountEl) return;
 
     const val = parseFloat(amountEl.value);
     if (isNaN(val)) return;
 
-    amountEl.value = (val * multiplier).toFixed(2).replace(/\.00$/, "");
+    const next = val * multiplier;
+    amountEl.value = Math.max(0, next).toFixed(2).replace(/\.00$/, "");
   });
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
     const tags = [...document.querySelectorAll(".tag-pill")].map(
       p => p.dataset.tag
     );
 
     const ingredients = [...document.querySelectorAll(".ingredient-row")]
       .map(r => {
         const amountVal = r.querySelector(".ing-amount").value;
-        const amount = amountVal === "" ? "" : parseFloat(amountVal);
+        const parsedAmount = amountVal === "" ? "" : parseFloat(amountVal);
+        const amount = Number.isNaN(parsedAmount) ? "" : Math.max(0, parsedAmount);
 
         return {
-          amount: Number.isNaN(amount) ? "" : amount,
+          amount,
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
-      cookingTime: Number.isNaN(cookingTime) ? "" : cookingTime,
-      ovenTemp: Number.isNaN(ovenTemp) ? "" : ovenTemp,
+      cookingTime: Number.isNaN(cookingTime) ? "" : Math.max(0, cookingTime),
+      ovenTemp: Number.isNaN(ovenTemp) ? "" : Math.max(0, ovenTemp),
       servings,
       instructions: document.getElementById("instructions").value
     };
 
+    for (const tag of tags) {
+      await FirebaseService.addTag(tag);
+    }
+    await FirebaseService.saveIngredients(ingredients);
+
     if (editingId) {
-      await FirebaseService.updateRecipe(editingId, data);
-      console.log("Recipe updated:", editingId, data);
+      const nextId = await FirebaseService.updateRecipe(editingId, data);
+      editingId = nextId;
+      console.log("Recipe updated:", nextId, data);
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
