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
const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
const getGoogleSignInErrorMessage = (error) => {
  switch (error.code) {
    case "auth/operation-not-allowed":
      return "Google sign-in is disabled. Enable the Google provider in Firebase Authentication.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized. Add localhost or your website domain in Firebase Authentication settings.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Sign in using its existing method.";
    case "auth/network-request-failed":
      return "Network request failed. Check your connection and try again.";
    default:
      return `Google sign-in failed (${error.code || "unknown error"}).`;
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

export {
  app,
  auth,
  db,
  signInWithGoogle,
  getGoogleSignInErrorMessage,
  signInWithGithub,
  logout,
};
export default app;
