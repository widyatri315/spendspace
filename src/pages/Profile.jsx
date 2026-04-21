import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getDatabase, ref, get, update } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";

function Profile() {
  const [user] = useAuthState(auth);
  const db = getDatabase();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    gender: "",
    phone: "",
    address: "",
    photoURL: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ===== FETCH USER DATA ===== */
  useEffect(() => {
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    get(userRef).then((snap) => {
      if (snap.exists()) {
        setForm({
          fullName: snap.val().fullName || user.displayName || "",
          email: user.email,
          gender: snap.val().gender || "",
          phone: snap.val().phone || "",
          address: snap.val().address || "",
          photoURL: snap.val().photoURL || user.photoURL || "",
        });
      }
      setLoading(false);
    });
  }, [user]);

  /* ===== UPDATE PROFILE ===== */
  const handleSave = async () => {
    setSaving(true);

    await update(ref(db, `users/${user.uid}`), {
      fullName: form.fullName,
      gender: form.gender,
      phone: form.phone,
      address: form.address,
      photoURL: form.photoURL,
      isProfileComplete: true,
    });

    setSaving(false);
    alert("Profile updated successfully ✅");
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          value={form.email}
          disabled
          className="w-full border p-2 rounded bg-gray-100"
        />

        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <input
          type="text"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

export default Profile;
