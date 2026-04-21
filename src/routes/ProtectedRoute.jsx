import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) return null; // atau loading spinner

  // belum login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // login tapi belum verifikasi email
  if (!user.emailVerified) {
    return <Navigate to="/verify" replace />;
  }

  // login + sudah verifikasi
  return children;
};

export default ProtectedRoute;
