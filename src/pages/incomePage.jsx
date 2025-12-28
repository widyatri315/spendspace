import React, { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, app } from "../firebase.js";
import IncomePopup from "./incomePopup";
import IncomeUpdatePopup from "./updateIncome";
import { getDatabase, ref, get, remove, onValue } from "firebase/database";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

function IncomePage() {
  const [user, loading, error] = useAuthState(auth);
  const [incomes, setIncomes] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [selectedIncomeId, setSelectedIncomeId] = useState(null);
  const [userFullName, setUserFullName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
  if (!user) return;

  const db = getDatabase(app);
  const incomeRef = ref(db, `incomeList/${user.uid}`);

  const unsubscribe = onValue(incomeRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.entries(data).map(([id, item]) => ({
        id,
        ...item,
      }));
      setIncomes(list.reverse());
    } else {
      setIncomes([]);
    }
  });

  return () => unsubscribe(); // cleanup listener
}, [user]);

  const totalIncome = incomes.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  // total income (numeric) from incomes array

  // Pagination state + handlers (if needed in future)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentIncomes = incomes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

const totalPages = Math.ceil(incomes.length / itemsPerPage);

  // delete income function
  const DeleteIncome = async (incomeId) => {
  const confirmDelete = window.confirm("Yakin ingin menghapus income ini?");
  if (!confirmDelete) return;

  try {
    const db = getDatabase(app);
    const uid = auth.currentUser.uid;

    await remove(ref(db, `incomeList/${uid}/${incomeId}`));
    alert("Income berhasil dihapus");
  } catch (error) {
    console.error(error);
    alert("Gagal menghapus income");
  }
};

  return (
    <div className="min-h-screen w-full p-6">
      <div className=" mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Income</h2>
            <div className="text-sm text-gray-600">
              Hello, {userFullName || user?.email || "User"}
            </div>
          </div>

          <div className="flex items-center gap-2s">
            <button
              onClick={() => setShowPopup(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm"
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
                {currentIncomes.map((item) => (
                  <tr key={item.id} className="border-b border-default">
                    <td className="px-3 py-2 font-medium ">{item.date}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.sourceCategory}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(Number(item.amount) || 0)}</td>
                    <td className="px-3 py-2 text-center font-medium">
                      {/* Future: Add edit/delete actions here */}
                      <button className="mr-2 text-green-500" 
                      onClick={() => {
                        setSelectedIncome(item);
                        setSelectedIncomeId(item.id);
                        setOpenEdit(true);
                      }}><span className="mr-1">✏️</span> Edit
                      </button>
                      ||
                      <button className="ml-2 text-red-500" 
                      onClick={() => DeleteIncome(item.id)}><span className="mr-1">🗑️</span>
                        Delete
                      </button>
                    </td> 
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded border
                  ${
                    currentPage === page
                      ? "bg-orange-500 text-white"
                      : "bg-white"
                  }
                `}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div> 
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
      {openEdit && (
      <IncomeUpdatePopup
        open={openEdit}
        incomeData={selectedIncome}
        incomeId={selectedIncomeId}
        onClose={() => {
          setOpenEdit(false);
          fetchData(); // refresh data setelah update
          }}
        />
      )}

    </div>
  );
}

export default IncomePage;