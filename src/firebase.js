// Import Firebase services
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeW8uipWIHY8V4Ovfj1TlqrwCQG91Ik7I",
  authDomain: "faizupyzone-bf03f.firebaseapp.com",
  projectId: "faizupyzone-bf03f",
  storageBucket: "faizupyzone-bf03f.firebasestorage.app",
  messagingSenderId: "456985013453",
  appId: "1:456985013453:web:2818b55744e36c70610d84",
  measurementId: "G-4677K2HY57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;