/* ---------------------------------------------------------
   STORAGE SERVICE — RECIPES + TAGS
--------------------------------------------------------- */

const StorageService = (() => {
    const RECIPES_KEY = "fh_recipes";
    const TAGS_KEY = "fh_tags";

    /* -------------------- CORE HELPERS -------------------- */

    function _load(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

   const StorageService = {
     async getAllRecipes() {
       const snapshot = await db.collection('recipes').get();
       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     },
   
     async getRecipe(id) {
       const docRef = db.collection('recipes').doc(id);
       const docSnap = await docRef.get();
       return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
     },
   
     async addRecipe(recipe) {
       const docRef = await db.collection('recipes').add(recipe);
       return docRef.id;
     },
   
     async updateRecipe(id, recipe) {
       await db.collection('recipes').doc(id).set(recipe, { merge: true });
     },
   
     async deleteRecipe(id) {
       await db.collection('recipes').doc(id).delete();
     },
   
     async toggleFavorite(id) {
       const recipe = await this.getRecipe(id);
       if (!recipe) return false;
       const newFav = !recipe.isFavorite;
       await this.updateRecipe(id, { isFavorite: newFav });
       return newFav;
     }
   };

    function _generateId() {
        return Date.now().toString();
    }

    /* -------------------- RECIPES -------------------- */

    function getAllRecipes() {
        return _load(RECIPES_KEY);
    }

    function getAllRecipesSorted() {
        const recipes = getAllRecipes();
        return recipes
            .slice()
            .sort((a, b) => {
                // favourites first
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                // then alphabetical by title
                return (a.title || "").localeCompare(b.title || "");
            });
    }

    function getRecipe(id) {
        return getAllRecipes().find(r => r.id === id) || null;
    }

    function addRecipe(data) {
        const recipes = getAllRecipes();
        const recipe = {
            id: _generateId(),
            title: data.title || "",
            tags: data.tags || [],
            ingredients: data.ingredients || [],
            cookingTime: data.cookingTime || "",
            ovenTemp: data.ovenTemp || "",
            servings: data.servings || "",
            instructions: data.instructions || "",
            isFavorite: !!data.isFavorite
        };
        recipes.push(recipe);
        _save(RECIPES_KEY, recipes);
        return recipe.id;
    }

    function updateRecipe(id, data) {
        const recipes = getAllRecipes();
        const idx = recipes.findIndex(r => r.id === id);
        if (idx === -1) return;

        recipes[idx] = {
            ...recipes[idx],
            ...data,
            id, // keep id
            isFavorite: data.isFavorite ?? recipes[idx].isFavorite ?? false
        };

        _save(RECIPES_KEY, recipes);
    }

    function deleteRecipe(id) {
        const recipes = getAllRecipes().filter(r => r.id !== id);
        _save(RECIPES_KEY, recipes);
    }

    function toggleFavorite(id) {
        const recipes = getAllRecipes();
        const idx = recipes.findIndex(r => r.id === id);
        if (idx === -1) return;

        recipes[idx].isFavorite = !recipes[idx].isFavorite;
        _save(RECIPES_KEY, recipes);
        return recipes[idx].isFavorite;
    }

    /* -------------------- TAGS -------------------- */

    function getTags() {
        const tags = _load(TAGS_KEY);
        return tags.slice().sort((a, b) => a.localeCompare(b));
    }

    function addTag(tag) {
        const tags = _load(TAGS_KEY);
        if (!tags.includes(tag)) {
            tags.push(tag);
            _save(TAGS_KEY, tags);
        }
    }

    function deleteTag(tag) {
        const tags = _load(TAGS_KEY).filter(t => t !== tag);
        _save(TAGS_KEY, tags);
    }

    return {
        getAllRecipes,
        getAllRecipesSorted,
        getRecipe,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        getTags,
        addTag,
        deleteTag
    };
})();
