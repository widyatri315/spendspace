import React, { useEffect, useState } from "react";
import { MdArrowBackIos } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInWithGoogle } from "../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const handlesubmit = (e) => {
    e.preventDefault();
    if (fullName === "") {
      toast.error("Full Name is required!");
    } else if (password === "") {
      toast.error("Password is required!");
    } else if (password.length < 8) {
      toast.error("Password must atleast be of 8 characters!");
    } else if (email === "") {
      toast.error("Email-id is required!");
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredentials) => {
          console.log(userCredentials);
        })
        .catch((err) => {
          if (err.code === "auth/email-already-in-use") {
            toast.error("Email already registered, login to continue");
          } else {
            toast.error("Error occured, please try again");
          }
        });
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray px-4">
      <div className="bg-white w-full max-w-md md:max-w-lg rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl text-gray-800 font-medium text-center mb-1">
          Registration
        </h1>
        <p className="text-gray-500 leading-5 mb-4 text-center">
          Fill the details to register
        </p>

        {error && (
          <div className="my-4 text-center text-red-500"> {error.message} </div>
        )}

        <form onSubmit={handlesubmit} className="flex flex-col gap-4">
          <label className="relative block">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {fullName ? "" : "Full Name"}
            </span>
          </label>

          <label className="relative block">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {email ? "" : "Email"}
            </span>
          </label>

          <label className="relative block">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {password ? "" : "Password"}
            </span>
          </label>

          <div className="flex items-start gap-3">
            <input
              id="link-checkbox"
              type="checkbox"
              value=""
              className="w-5 h-5 rounded text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="link-checkbox" className="text-sm text-gray-900">
              I agree with the{" "}
              <span className="text-purple-600 hover:underline">
                terms & conditions
              </span>{" "}
              and{" "}
              <span className="text-purple-600 hover:underline">
                privacy-policy
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-purple-500 hover:bg-purple-700 text-white rounded-full text-base font-medium"
          >
            Submit
          </button>
          <ToastContainer />
        </form>

        <div className="flex items-center justify-center mt-6 text-gray-500">
          <div className="border-t border-gray-300 w-24 mr-3" />
          OR
          <div className="border-t border-gray-300 w-24 ml-3"></div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <button
            type="button"
            className="w-full h-12 bg-white border border-gray-200 text-base font-medium rounded-full mt-3 p-2 flex items-center justify-center gap-3"
            onClick={() => signInWithGoogle()}
          >
            <img
              src={require("../assets/Google.png")}
              alt="google"
              className="h-6"
            />
            With Google
          </button>

          <div className="text-gray-600 mt-3 mb-1 text-sm">
            Already have an account?{" "}
            <Link to={"/login"}>
              <span className="text-purple-500 font-medium">Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
   );
};

export default Register;
