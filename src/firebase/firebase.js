import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhcG5bpjRFJj6z7dfScHiEeaaO5qfuBOI",
  authDomain: "fintrack-4b04b.firebaseapp.com",
  projectId: "fintrack-4b04b",
  storageBucket: "fintrack-4b04b.firebasestorage.app",
  messagingSenderId: "36744749834",
  appId: "1:36744749834:web:562b273e05f55b261950f3",
  measurementId: "G-RPE0ZL0H0V",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
