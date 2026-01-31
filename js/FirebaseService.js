// firebase-service.js
// Make sure you include this script BEFORE any page scripts

// Your Firebase config (replace with your values)
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXX",
  authDomain: "family-hub.firebaseapp.com",
  projectId: "family-hub",
  storageBucket: "family-hub.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Firebase Service
const FirebaseService = (() => {
  const RECIPES_COLLECTION = "recipes";
  const TAGS_COLLECTION = "tags";

  return {
    // Recipes
    async getAllRecipes() {
      const snapshot = await db.collection(RECIPES_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getAllRecipesSorted() {
      const recipes = await this.getAllRecipes();
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

    // Tags
    async getTags() {
      const snapshot = await db.collection(TAGS_COLLECTION).get();
      return snapshot.docs.map(doc => doc.id);
    },

    async addTag(tag) {
      await db.collection(TAGS_COLLECTION).doc(tag).set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
  };
})();
