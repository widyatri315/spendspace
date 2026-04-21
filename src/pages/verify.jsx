import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useRegister } from "../context/RegisterContext";
import { toast } from "react-toastify";

const Verify = () => {
  const { registerData } = useRegister();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);

  // kirim email verification
  const sendVerification = async () => {
    try {
      setSending(true);
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent!");
    } catch (err) {
      toast.error("Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  // cek status verifikasi
  const checkVerification = async () => {
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      setVerified(true);
      navigate("/dashboard");
    } else {
      toast.warning("Email not verified yet");
    }
  };

  // proteksi page
  useEffect(() => {
    if (!auth.currentUser || !registerData?.email) {
      navigate("/register");
    }
  }, [navigate, registerData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-6 text-center">

        <h1 className="text-2xl font-semibold mb-2">
          Verify Your Email
        </h1>

        <p className="text-gray-600 mb-6">
          We have sent a verification link to:
          <br />
          <span className="font-medium text-black">
            {registerData?.email}
          </span>
        </p>

        <button
          onClick={sendVerification}
          disabled={sending}
          className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full mb-3 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Resend Verification Email"}
        </button>

        <button
          onClick={checkVerification}
          className="w-full h-12 border border-purple-500 text-purple-500 rounded-full"
        >
          I Have Verified
        </button>

      </div>
    </div>
  );
};

export default Verify;
