import React, { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, app } from "../firebase.js";
import IncomePopup from "./incomePopup";
import { getDatabase, ref, get } from "firebase/database";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

function IncomePage() {
  const [user, loading, error] = useAuthState(auth);
  const [incomes, setIncomes] = useState([]);
  const [userFullName, setUserFullName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      if (!user) {
        setIncomes([]);
        return;
      }
      const rtdb = getDatabase(app);
      const incomeListRef = ref(rtdb, `incomeList/${user.uid}`); // <-- per-user read
      const snapshot = await get(incomeListRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.entries(val).map(([id, item]) => ({ id, ...item }));
        setIncomes(list.reverse());
      } else {
        setIncomes([]);
      }
    } catch (err) {
      console.error("Failed to fetch incomes:", err);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // fetch display name (ke Firestore users collection) — unchanged
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) { setUserFullName(""); return; }
      if (user.displayName) { setUserFullName(user.displayName); return; }
      try {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setUserFullName(docData.fullName || docData.firstName || docData.name || user.email);
        } else setUserFullName(user.email);
      } catch (err) { console.error(err); setUserFullName(user.email); }
    };
    fetchUserName();
  }, [user]);

  const totalIncome = incomes.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  // total income (numeric) from incomes array


  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className=" mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Income</h2>
            <div className="text-sm text-gray-600">
              Hello, {userFullName || user?.email || "User"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPopup(true)}
              className="px-4 py-2 bg-purple-700 text-white rounded-full"
            >
              Add Income
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="px-3 py-2 border rounded-full text-sm"
            >
              Profile
            </button>
          </div>
        </div>

        {/* total box separate */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Income</div>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="text-sm text-gray-500">{incomes.length} records</div>
          </div>
        </div>

        {/* incomes list */}
        <div className="bg-white rounded-lg shadow p-4">
          {loading && <div className="text-gray-500">Loading...</div>}
          {error && <div className="text-red-500">Auth error: {error.message}</div>}

          {incomes.length === 0 ? (
            <div className="text-gray-500">No income records found.</div>
          ) : (
            <table className="w-full table-auto">
              <thead className="text-sm text-body border-b border-default">
                <tr className="px-6 py-3 bg-neutral-secondary-soft font-medium">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Source</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-center py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((item) => (
                  <tr key={item.id} className="border-b border-default">
                    <td className="px-3 py-2 font-medium ">{item.date}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.sourceCategory}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(Number(item.amount) || 0)}</td>
                    <td className="px-3 py-2 text-center font-medium">
                      {/* Future: Add edit/delete actions here */}
                      <button className="mr-2 text-green-500">
                        ✏️ Edit
                      </button>
                      ||
                      <button className="ml-2 text-red-500">
                        🗑️ Delete
                      </button>
                    </td> 
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* modal popup */}
      {showPopup && (
        <IncomePopup
          open={showPopup}
          onClose={() => {
            setShowPopup(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

export default IncomePage;