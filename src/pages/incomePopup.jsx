import React, { useState } from "react";
import app, { auth } from "../firebase.js";
import { getDatabase, ref, push, set } from "firebase/database";

const formatCurrency = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

const onlyDigits = (str) => String(str).replace(/[^0-9]/g, "");

const IncomePopup = ({ open, onClose }) => {
  const [amountDisplay, setAmountDisplay] = useState("");
  const [amountRaw, setAmountRaw] = useState(0);
  const [sourceCategory] = useState([
    "Cash", "Bank Mandiri", "Bank BCA", "Bank BNI", "Bank BRISyariah",
    "Bank Syariah Indonesia", "OVO", "Gopay", "ShopeePay", "DANA", "LinkAja",
  ]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Hooks first; early return
  if (!open) return null;

  const handleAmountChange = (e) => {
    const rawStr = onlyDigits(e.target.value);
    const rawNum = Number(rawStr) || 0;
    setAmountRaw(rawNum);
    setAmountDisplay(rawStr ? formatCurrency(rawNum) : "");
  };
  const handleAmountFocus = () => setAmountDisplay(amountRaw ? String(amountRaw) : "");
  const handleAmountBlur = () => setAmountDisplay(amountRaw ? formatCurrency(amountRaw) : "");

  const saveData = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !description || !date) {
      alert("Please complete all fields");
      return;
    }
    if (!auth.currentUser) {
      alert("User not authenticated");
      return;
    }

    setSaving(true);
    try {
      const db = getDatabase(app);
      const uid = auth.currentUser.uid;
      const incomeListRef = ref(db, `incomeList/${uid}`); // <-- per-user path
      const newIncomeRef = push(incomeListRef);
      await set(newIncomeRef, {
        amount: amountRaw,
        sourceCategory: selectedCategory,
        description,
        date,
        createdAt: Date.now(),
      });
      // reset + close
      setAmountDisplay("");
      setAmountRaw(0);
      setSelectedCategory("");
      setDescription("");
      setDate("");
      setSaving(false);
      onClose && onClose();
    } catch (error) {
      setSaving(false);
      console.error("Failed to save data:", error);
      alert("Failed to save data: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Income</h3>
          <button onClick={() => onClose && onClose()} className="text-gray-600">✕</button>
        </div>

        <form onSubmit={saveData} className="flex flex-col gap-4">
          <input
            type="text"
            value={amountDisplay}
            onChange={handleAmountChange}
            onFocus={handleAmountFocus}
            onBlur={handleAmountBlur}
            placeholder="Amount (e.g. 100000)"
            className="w-full h-12 px-4 rounded border border-gray-300"
            required
          />

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full h-12 px-4 rounded border border-gray-300" required>
            <option value="">Select source</option>
            {sourceCategory.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full h-12 px-4 rounded border border-gray-300" required />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-12 px-4 rounded border border-gray-300" required />

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => onClose && onClose()} className="px-4 py-2 rounded-full border">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-full bg-purple-700 text-white">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomePopup;