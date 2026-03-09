// firebase-service.js

const firebaseConfig = {
  apiKey: "AIzaSyXXXXXX",
  authDomain: "family-hub.firebaseapp.com",
  projectId: "family-hub",
  storageBucket: "family-hub.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

// Init Firebase ONCE
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

const FirebaseService = (() => {
  const RECIPES = "recipes";
  const TAGS = "tags";
  const INGREDIENTS = "ingredients";

  function toDocId(value) {
    return String(value || "")
      .trim()
      .replace(/[/.#$\[\]]/g, "-");
  }

  return {
    async getAllRecipes() {
      const snap = await db.collection(RECIPES).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async getAllRecipesSorted() {
      const recipes = await this.getAllRecipes();
      return recipes.sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));
    },

    async getRecipe(id) {
      const doc = await db.collection(RECIPES).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async addRecipe(data) {
      const recipeId = toDocId(data.title);
      if (!recipeId) throw new Error("Recipe needs a valid name.");

      await db.collection(RECIPES).doc(recipeId).set({
        ...data,
        isFavorite: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return recipeId;
    },

    async updateRecipe(id, data) {
      const oldId = toDocId(id);
      const nextId = toDocId(data.title);
      if (!nextId) throw new Error("Recipe needs a valid name.");

      const oldRef = db.collection(RECIPES).doc(oldId);
      const nextRef = db.collection(RECIPES).doc(nextId);

      const oldDoc = await oldRef.get();
      const oldData = oldDoc.exists ? oldDoc.data() : {};

      await nextRef.set({
        ...oldData,
        ...data,
        title: data.title,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (oldId && oldId !== nextId) {
        await oldRef.delete();
      }

      return nextId;
    },

    async deleteRecipe(id) {
      await db.collection(RECIPES).doc(id).delete();
    },

    async toggleFavorite(id) {
      const recipe = await this.getRecipe(id);
      if (!recipe) return false;

      const next = !recipe.isFavorite;
      await this.updateRecipe(id, { isFavorite: next, title: recipe.title });
      return next;
    },

    async getTags() {
      const snap = await db.collection(TAGS).get();
      return snap.docs
        .map(d => d.data().name || d.id)
        .sort((a, b) => a.localeCompare(b));
    },

    async addTag(tag) {
      if (!tag) return;

      const tagId = toDocId(tag);
      if (!tagId) return;

      await db.collection(TAGS).doc(tagId).set({
        name: tag.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async saveIngredients(ingredients = []) {
      const writes = ingredients
        .filter(i => i && i.name)
        .map(i => {
          const ingredientName = i.name.trim();
          const ingredientId = toDocId(ingredientName);
          if (!ingredientId) return null;

          return db.collection(INGREDIENTS).doc(ingredientId).set({
            name: ingredientName,
            lastUsedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        })
        .filter(Boolean);

      await Promise.all(writes);
    }
  };
})();
