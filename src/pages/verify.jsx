import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Verify = () => {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const sendVerificationLink = async () => {
    try {
      setSending(true);
      await sendEmailVerification(user);
      toast.success("Verification link sent to your email.");
    } catch (err) {
      toast.error(`Could not send the verification link (${err.code || "unknown error"}).`);
    } finally {
      setSending(false);
    }
  };

  const checkVerification = async () => {
    try {
      setChecking(true);
      await user.reload();
      if (user.emailVerified) {
        await user.getIdToken(true);
        navigate("/dashboard");
      } else {
        toast.warning("Email is not verified yet. Open the link in your inbox first.");
      }
    } catch (err) {
      toast.error("Could not check email verification. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/register");
    } else if (user.emailVerified) {
      navigate("/dashboard");
    }
  }, [loading, navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">
          Verify Your Email
        </h1>

        <p className="text-gray-600 mb-6">
          Open the verification link sent to:
          <br />
          <span className="font-medium text-black">
            {user?.email}
          </span>
        </p>

        <button
          type="button"
          onClick={sendVerificationLink}
          disabled={sending || loading || !user}
          className="w-full h-12 border border-purple-500 text-purple-500 rounded-full mt-3 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Resend verification link"}
        </button>

        <button
          type="button"
          onClick={checkVerification}
          disabled={checking || loading || !user}
          className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full mt-3 disabled:opacity-50"
        >
          {checking ? "Checking..." : "I have verified"}
        </button>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Verify;
