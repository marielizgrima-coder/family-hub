// FirebaseService.js
const FirebaseService = (() => {
  const db = firebase.firestore();
  const RECIPES_COLLECTION = "recipes";
  const TAGS_COLLECTION = "tags";

  return {
    async getAllRecipes() {
      const snapshot = await db.collection(RECIPES_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getAllRecipesSorted() {
      const recipes = await this.getAllRecipes();
      // favorites first
      return recipes.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    },

    async getRecipe(id) {
      const doc = await db.collection(RECIPES_COLLECTION).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async addRecipe(data) {
      const docRef = await db.collection(RECIPES_COLLECTION).add(data);
      return docRef.id;
    },

    async updateRecipe(id, data) {
      await db.collection(RECIPES_COLLECTION).doc(id).set(data, { merge: true });
    },

    async deleteRecipe(id) {
      await db.collection(RECIPES_COLLECTION).doc(id).delete();
    },

    async toggleFavorite(id) {
      const recipe = await this.getRecipe(id);
      if (!recipe) return false;
      const newFav = !recipe.isFavorite;
      await this.updateRecipe(id, { isFavorite: newFav });
      return newFav;
    },

    async getTags() {
      const snapshot = await db.collection(TAGS_COLLECTION).get();
      return snapshot.docs.map(doc => doc.id);
    },

    async addTag(tag) {
      await db.collection(TAGS_COLLECTION).doc(tag).set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
  };
})();
