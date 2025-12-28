import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdArrowBackIos } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { auth, signInWithGoogle } from "../firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialState = {
  email: "",
  password: "",
};

const Login = () => {
  const [Data, setData] = useState(initialState);
  const { password, email } = Data;
  const [user, loading, error] = useAuthState(auth);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handlesubmit = (e) => {
    e.preventDefault();
    if (email === "") {
      toast.error("Email-id is required!");
    } else if (password === "") {
      toast.error("Password is required!");
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredentials) => {
          console.log(userCredentials);
        })
        .catch((err) => {
          if (err.code === "auth/invalid-email") {
            toast.error("Invalid email id!");
          }
          if (err.code === "auth/user-not-found") {
            toast.error("User not registered!");
          }
          if (err.code === "auth/wrong-password") {
            toast.error("You entered wrong password!");
          }
          if (err.code === "auth/too-many-requests") {
            toast.error("Too many attempts, Please try after sometime!");
          }
        });
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) {
      navigate("/incomePage");
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setData({ ...Data, [e.target.name]: e.target.value });
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray px-4">
      <div className="bg-white w-full max-w-md md:max-w-lg rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl text-gray-800 text-center font-bold mb-2">
          Welcome Back!
        </h1>
        <p className="text-gray-500 leading-5 text-center mb-4">
          Sign-in to continue
        </p>
        {error && (
          <div className="my-4 text-center text-red-500"> {error.message} </div>
        )}

        <form onSubmit={handlesubmit} className="flex flex-col gap-4">
          <label className="relative block">
            <input
              type="text"
              name="email"
              value={email}
              id="email"
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {email ? "" : "Email"}
            </span>
          </label>
          <label className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={handleChange}
              className="w-full h-12 pr-12 pl-4 rounded-full outline-none border border-gray-300 focus:border-purple-500 transition duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none h-10 w-10 flex items-center justify-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              
              {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
            <span className="absolute left-4 top-3 text-gray-500 transition duration-300 input-text">
              {password ? "" : "Password"}
            </span>
          </label>

          <button
            type="submit"
            className="w-full h-12 bg-purple-700 text-white text-base font-medium rounded-full mt-2"
          >
            Submit
          </button>
        </form>

        <ToastContainer />

        <div className="flex items-center justify-center mt-6 text-gray-500">
          <div className="border-t border-gray-300 w-24 mr-3" />
          OR
          <div className="border-t border-gray-300 w-24 ml-3"></div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <button
            type="button"
            className="w-full h-12 bg-gray-100 text-black text-base font-medium rounded-full flex items-center justify-center gap-3"
            onClick={() => signInWithGoogle()}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/128/2991/2991148.png"
              alt="google"
              className="h-6"
            />
            Login with Google
          </button>

          <div className="text-gray-600 mt-3 mb-1 text-sm">
            Don't have an account?{" "}
            <Link to={"/register"}>
              <span className="text-purple-500 font-medium">Register here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
   );
};

export default Login;
