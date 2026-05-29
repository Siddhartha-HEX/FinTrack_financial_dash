import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXCoBXKKebk548nvnQyu0l5in_AX9RP-s",
  authDomain: "fintrack--finance-dashboard.firebaseapp.com",
  projectId: "fintrack--finance-dashboard",
  storageBucket: "fintrack--finance-dashboard.appspot.com",
  messagingSenderId: "40236407674",
  appId: "1:40236407674:web:2e3a6caa2a26b8502114c3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;