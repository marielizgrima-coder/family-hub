// firebase-service.js

// 🔥 Firebase config (ONLY PLACE IT EXISTS)
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXX",
  authDomain: "family-hub.firebaseapp.com",
  projectId: "family-hub",
  storageBucket: "family-hub.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

// Init Firebase ONCE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const FirebaseService = (() => {
  const RECIPES = "recipes";
  const TAGS = "tags";

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
      const ref = await db.collection(RECIPES).add({
        ...data,
        isFavorite: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return ref.id;
    },

    async updateRecipe(id, data) {
      await db.collection(RECIPES).doc(id).set(data, { merge: true });
    },

    async deleteRecipe(id) {
      await db.collection(RECIPES).doc(id).delete();
    },

    async toggleFavorite(id) {
      const recipe = await this.getRecipe(id);
      if (!recipe) return false;
      const next = !recipe.isFavorite;
      await this.updateRecipe(id, { isFavorite: next });
      return next;
    },

    async getTags() {
      const snap = await db.collection(TAGS).get();
      return snap.docs.map(d => d.id);
    },

    async addTag(tag) {
      if (!tag) return;
      await db.collection(TAGS).doc(tag).set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  };
})();
