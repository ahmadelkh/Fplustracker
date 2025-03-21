// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmJ8RTGkd6XR9ak1HIS1OeaErNI0lLBwI",
  authDomain: "inventoryapp-430a5.firebaseapp.com",
  databaseURL: "https://inventoryapp-430a5-default-rtdb.firebaseio.com",
  projectId: "inventoryapp-430a5",
  storageBucket: "inventoryapp-430a5.firebasestorage.app",
  messagingSenderId: "200771328407",
  appId: "1:200771328407:web:82d62119c62685f53f4cd2",
  measurementId: "G-SYH8MW9DMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore
const analytics = getAnalytics(app);

export { db, analytics };
