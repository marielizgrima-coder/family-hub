// Your Firebase config copied from console
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

// Initialize Firestore
const db = firebase.firestore();
