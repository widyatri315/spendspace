import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, logout, app } from "../firebase.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PopupModal from "./PopupModal.jsx";

const initialState = {
  firstName: "",
  lastName: "",
  age: "",
  profession: "",
};

const HomePage = () => {
  const [user, error] = useAuthState(auth);
  const [progress, setProgress] = useState(null);
  const [data, setData] = useState(initialState);
  const [isSubmit, setIsSubmit] = useState(false);
  const { firstName, lastName, age, profession } = data;
  const navigate = useNavigate();

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not authenticated. Please login.");
      return navigate("/login");
    }
    if (firstName === "") {
      toast.error("First Name is required!");
    } else if (lastName === "") {
      toast.error("Last Name is required!");
    } else if (profession === "") {
      toast.error("Enter your Profession!");
    } else if (age === "") {
      toast.error("Age is required!");
    } else {
      try {
        setIsSubmit(true); // tanda sedang submit
        await addDoc(collection(db, "users"), {
          ...data,
          email: user.email,
          uid: user.uid,
          timestamp: serverTimestamp(),
        });
        toast.success("Profile created successfully");
        // langsung navigasi setelah sukses (atau tetap pakai timeout bila butuh)
        setTimeout(() => {
          navigate("/profile");
        }, 5000);
      } catch (err) {
        console.error("Create doc error:", err);
        toast.error(err.message || "Failed to create profile");
        setIsSubmit(false);
      }
    }
  };

 return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md md:max-w-lg rounded-lg shadow-lg p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Link to={"/profile"}>
            <button className="bg-purple-700 text-white text-xs sm:text-base px-4 py-2 rounded-full">
              Profile
            </button>
          </Link>
          <button
            onClick={logout}
            className="bg-purple-700 text-white text-xs sm:text-base rounded-full py-2 px-4"
          >
            Logout
          </button>
        </div>

        <h1 className="text-purple-700 p-1 text-center text-base xs:text-xl font-black">
          Hello {user && user.email}
        </h1>
        <h2 className="mt-1 text-2xl text-center">User Details Form</h2>
        <p className="mb-4 text-center text-gray-500">
          Fill all the details to create your profile
        </p>

        {error && <div className="text-red-500 text-center mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="relative block">
            <input
              type="text"
              name="firstName"
              value={firstName}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {firstName ? "" : "First name"}
            </span>
          </label>

          <label className="relative block">
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {lastName ? "" : "Last name"}
            </span>
          </label>

          <label className="relative block">
            <input
              type="text"
              name="profession"
              value={profession}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {profession ? "" : "Profession"}
            </span>
          </label>

          <label className="relative block">
            <input
              type="text"
              name="age"
              value={age}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {age ? "" : "Age"}
            </span>
          </label>

          <button
            type="submit"
            disabled={progress !== null && progress < 100}
            className={`w-full h-12 text-white rounded-full text-base font-medium ${
              progress !== null && progress < 100
                ? "bg-gray-300"
                : "bg-violet-700 hover:bg-violet-800"
            }`}
          >
            {progress > 1 && progress < 100 ? "Uploading" : "Submit"}
          </button>
        </form>

        <ToastContainer />
      </div>

      <PopupModal open={isSubmit} name={firstName} className="z-50" />
    </div>
  );
};

export default HomePage;
