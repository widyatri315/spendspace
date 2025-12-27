import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCa4AUKeZSZqIWA1SGi2fBO6a52tccWcWc",
  authDomain: "spendspace-45463.firebaseapp.com",
  databaseURL: "https://spendspace-45463-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "spendspace-45463",
  storageBucket: "spendspace-45463.firebasestorage.app",
  messagingSenderId: "292367708988",
  appId: "1:292367708988:web:f3d8c5e1354a909067e439",
  measurementId: "G-X378T56GNH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    console.log(user);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const githubProvider = new GithubAuthProvider();
const signInWithGithub = async () => {
  try {
    const res = await signInWithPopup(auth, githubProvider);
    const user = res.user;
    console.log(user);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const logout = () => {
  signOut(auth);
};

export { app, auth, db, signInWithGoogle, signInWithGithub, logout };
