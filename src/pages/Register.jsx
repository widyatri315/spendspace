import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInWithGoogle } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile, sendEmailVerification
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRegister } from "../context/RegisterContext";

const Register = () => {
  const { setRegisterData } = useRegister();
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ===== VALIDATION =====
    if (!fullName) return toast.error("Full Name is required");
    if (!email) return toast.error("Email is required");
    if (password.length < 8)
      return toast.error("Password minimum 8 characters");
    if (password !== confirmPassword)
      return toast.error("Password confirmation does not match");

    try {
      // 🔐 CREATE AUTH USER
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 👤 SAVE NAME TO AUTH PROFILE
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // 📦 SAVE TO REGISTER CONTEXT (MULTI STEP)
      setRegisterData({
        uid: userCredential.user.uid,
        email,
        fullName,
      });
      toast.success("Register success!");
      await sendEmailVerification(userCredential.user);

      navigate("/verify"); // ➡️ STEP 2
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already registered");
      } else {
        toast.error("Register failed");
      }
    }
  };

  // 🔁 AUTO REDIRECT IF LOGGED IN
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray px-4">
      <div className="bg-white w-full max-w-md md:max-w-lg rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl text-gray-800 font-medium text-center mb-1">
          Registration
        </h1>
        <p className="text-gray-500 mb-4 text-center">
          Fill the details to register
        </p>

        {error && (
          <div className="my-4 text-center text-red-500">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* FULL NAME */}
          <label className="relative block">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 px-4 rounded-full border border-gray-300 focus:border-purple-500"
            />
            <span className="absolute left-4 top-3 text-gray-500">
              {fullName ? "" : "Full Name"}
            </span>
          </label>

          {/* EMAIL */}
          <label className="relative block">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-full border border-gray-300 focus:border-purple-500"
            />
            <span className="absolute left-4 top-3 text-gray-500">
              {email ? "" : "Email"}
            </span>
          </label>

          {/* PASSWORD */}
          <label className="relative block">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-full border border-gray-300 focus:border-purple-500"
            />
            <span className="absolute left-4 top-3 text-gray-500">
              {password ? "" : "Password"}
            </span>
          </label>

          {/* CONFIRM PASSWORD */}
          <label className="relative block">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-full border border-gray-300 focus:border-purple-500"
            />
            <span className="absolute left-4 top-3 text-gray-500">
              {confirmPassword ? "" : "Confirm Password"}
            </span>
          </label>

          <button
            type="submit"
            className="w-full h-12 bg-purple-500 hover:bg-purple-700 text-white rounded-full"
          >
            Submit
          </button>

          <ToastContainer />
        </form>

        {/* GOOGLE */}
        <div className="flex items-center justify-center mt-6 text-gray-500">
          <div className="border-t w-24 mr-3" />
          OR
          <div className="border-t w-24 ml-3" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full h-12 bg-white border rounded-full mt-3 flex items-center justify-center gap-3"
        >
          <img
            src={require("../assets/Google.png")}
            alt="google"
            className="h-6"
          />
          With Google
        </button>

        <div className="text-gray-600 mt-3 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-500 font-medium">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
