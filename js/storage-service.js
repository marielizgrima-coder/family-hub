/* ---------------------------------------------------------
   STORAGE SERVICE
   A clean, expandable system for saving all app data.
   Everything is stored under one key: "FAMILY_HUB_DATA"
--------------------------------------------------------- */

const StorageService = {
    // Load full app data
    loadData() {
        const raw = localStorage.getItem("FAMILY_HUB_DATA");
        return raw ? JSON.parse(raw) : {
            recipes: {},
            tags: {
                recipes: [],
                shopping: [],
                calendar: [],
                todos: []
            }
        };
    },

    // Save full app data
    saveData(data) {
        localStorage.setItem("FAMILY_HUB_DATA", JSON.stringify(data));
    },

    /* ---------------------------------------------------------
       TAGS
    --------------------------------------------------------- */

    getTags() {
        const data = this.loadData();
        return data.tags.recipes || [];
    },

    addTag(tag) {
        const data = this.loadData();
        if (!data.tags.recipes.includes(tag)) {
            data.tags.recipes.push(tag);
            this.saveData(data);
        }
    },

    /* ---------------------------------------------------------
       RECIPES
    --------------------------------------------------------- */

    getAllRecipes() {
        const data = this.loadData();
        return Object.values(data.recipes);
    },

    getRecipe(id) {
        const data = this.loadData();
        return data.recipes[id] || null;
    },

    addRecipe(recipe) {
        const data = this.loadData();
        const id = Date.now().toString(); // simple unique ID
        data.recipes[id] = { id, ...recipe };
        this.saveData(data);
        return id;
    },

    updateRecipe(id, updatedRecipe) {
        const data = this.loadData();
        if (data.recipes[id]) {
            data.recipes[id] = { id, ...updatedRecipe };
            this.saveData(data);
        }
    },

    deleteRecipe(id) {
        const data = this.loadData();
        delete data.recipes[id];
        this.saveData(data);
    }
};

