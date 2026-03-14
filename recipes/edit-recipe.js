/* =====================================================
   GLOBAL STATE
===================================================== */

let editingId = null;
let ingredientList = [];

/* =====================================================
   CONSTANTS
===================================================== */

const MEASUREMENT_UNITS = [
  '',
  'tsp',
  'tbsp',
  'cup',
  'ml',
  'l',
  'g',
  'kg',
  'oz',
  'lb',
  'pinch',
  'clove',
  'piece',
];

/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  await loadExistingTags();
  await loadIngredients();
  checkIfEditing();
});

/* =====================================================
   TAGS
===================================================== */

async function loadExistingTags() {
  const select = document.getElementById('tagSelect');
  if (!select) return;

  select.innerHTML = `<option value="">Select tag</option>`;

  const tags = await FirebaseService.tags();

  tags.forEach((tag) => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  });
}

function addExistingTag() {
  const select = document.getElementById('tagSelect');
  if (!select || !select.value) return;

  addTagPill(select.value);
  select.value = '';
}

async function addNewTag() {
  const input = document.getElementById('newTagInput');
  if (!input) return;

  const tag = input.value.trim();
  if (!tag) return;

  await FirebaseService.addTag(tag);

  addTagPill(tag);
  input.value = '';

  await loadExistingTags();
}

function addTagPill(tag) {
  const container = document.getElementById('tagPills');
  if (!container) return;

  const exists = [...container.children].some(
    (p) => p.dataset.tag?.toLowerCase() === tag.toLowerCase()
  );

  if (exists) return;

  const pill = document.createElement('span');
  pill.className = 'tag-pill';
  pill.dataset.tag = tag;

  const remove = document.createElement('span');
  remove.className = 'remove-tag';
  remove.textContent = '×';
  remove.onclick = () => pill.remove();

  pill.append(tag + ' ');
  pill.appendChild(remove);

  container.appendChild(pill);
}

/* =====================================================
   INGREDIENT DATABASE (AUTOCOMPLETE)
===================================================== */

async function loadIngredients() {
  ingredientList = await FirebaseService.ingredients() || [];
  buildIngredientDatalist();
}

function buildIngredientDatalist() {
  const old = document.getElementById('ingredientsList');
  if (old) old.remove();

  const datalist = document.createElement('datalist');
  datalist.id = 'ingredientsList';

  ingredientList.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    datalist.appendChild(option);
  });

  document.body.appendChild(datalist);
}

async function ensureIngredientExists(name) {
  if (!name) return;

  if (!ingredientList.includes(name)) {
    ingredientList.push(name);
    await FirebaseService.addIngredient(name);
    buildIngredientDatalist();
  }
}

/* =====================================================
   EDIT MODE
===================================================== */

function checkIfEditing() {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get('id');

  if (editingId) loadRecipeData(editingId);
  else addIngredientRow();
}

async function loadRecipeData(id) {
  const recipe = await FirebaseService.recipes(id);
  if (!recipe) return;

  document.getElementById('pageTitle').textContent = 'Edit Recipe';
  document.getElementById('recipeName').value = recipe.title || '';

  (recipe.tags || []).forEach(addTagPill);

  if (recipe.ingredients?.length) {
    recipe.ingredients.forEach((i) =>
      addIngredientRow(i.amount, i.unit, i.name)
    );
  } else {
    addIngredientRow();
  }

  document.getElementById('cookingTime').value = recipe.cookingTime || '';
  document.getElementById('ovenTemp').value = recipe.ovenTemp || '';
  document.getElementById('servings').value = recipe.servings || '';
  document.getElementById('instructions').value = recipe.instructions || '';

  setupFavoriteButton(id, recipe.isFavorite);
  setupDeleteButton(id);
}

/* =====================================================
   INGREDIENT ROWS
===================================================== */

function createMeasurementSelect(value = '') {
  const select = document.createElement('select');
  select.className = 'ing-unit';

  MEASUREMENT_UNITS.forEach((unit) => {
    const option = document.createElement('option');
    option.value = unit;
    option.textContent = unit || 'unit';
    select.appendChild(option);
  });

  select.value = value || '';

  return select;
}

function addIngredientRow(amount = '', unit = '', name = '') {
  const container = document.getElementById('ingredients');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'ingredient-row';

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.className = 'ing-amount';
  amountInput.placeholder = 'Amount';
  amountInput.step = 'any';
  amountInput.value = amount;

  const unitSelect = createMeasurementSelect(unit);

  const nameInput = document.createElement('input');
  nameInput.className = 'ing-name';
  nameInput.placeholder = 'Ingredient';
  nameInput.setAttribute('list', 'ingredientsList');
  nameInput.value = name;

  const del = document.createElement('button');
  del.className = 'delete-ingredient';
  del.textContent = '×';
  del.onclick = () => row.remove();

  row.append(amountInput, unitSelect, nameInput, del);
  container.appendChild(row);
}

/* =====================================================
   SAVE RECIPE
===================================================== */

async function saveRecipe() {
  const title = document.getElementById('recipeName').value.trim();
  if (!title) return alert('Recipe needs a name');

  try {
    const tags = [...document.querySelectorAll('.tag-pill')].map(
      (p) => p.dataset.tag
    );

    const ingredients = [];

    for (const row of document.querySelectorAll('.ingredient-row')) {
      const name = row.querySelector('.ing-name').value.trim();
      if (!name) continue;

      const amountRaw = row.querySelector('.ing-amount').value;
      const amount = amountRaw === '' ? '' : parseFloat(amountRaw);

      const unit = row.querySelector('.ing-unit').value;

      await ensureIngredientExists(name);

      ingredients.push({
        name,
        unit,
        amount: Number.isNaN(amount) ? '' : amount,
      });
    }

    const cookingTime = parseInt(
      document.getElementById('cookingTime').value,
      10
    );

    const ovenTemp = parseInt(
      document.getElementById('ovenTemp').value,
      10
    );

    const data = {
      title,
      tags,
      ingredients,
      cookingTime: Number.isNaN(cookingTime) ? '' : cookingTime,
      ovenTemp: Number.isNaN(ovenTemp) ? '' : ovenTemp,
      servings: document.getElementById('servings').value,
      instructions: document.getElementById('instructions').value,
    };

    if (editingId) {
      await FirebaseService.updateRecipe(editingId, data);
    } else {
      await FirebaseService.addRecipe(data);
    }

    window.location.href = 'recipes.html';
  } catch (err) {
    console.error(err);
    alert('Failed to save recipe.');
  }
}
