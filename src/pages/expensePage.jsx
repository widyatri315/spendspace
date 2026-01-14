// ExpensePage.jsx
import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app } from "../firebase.js";
import ExpensePopup from "./expensePopup.jsx";
import ExpenseUpdatePopup from "./updateExpense.jsx";
import { getDatabase, ref, onValue, remove } from "firebase/database";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function ExpensePage() {
  const [user, loading, error] = useAuthState(auth);
  const [expenses, setExpenses] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* ================= FETCH REALTIME ================= */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase(app);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const unsubscribe = onValue(expenseRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, item]) => ({
          id,
          ...item,
        }));
        list.sort((a, b) => new Date(b.date) - new Date(a.date));

        setExpenses(list);
      } else {
        setExpenses([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  /* ================= TOTAL ================= */
  const totalExpense = expenses.reduce(
    (total, expense) => total + (expense.amount || 0),
    0
  );

  /* ================= PAGINATION ================= */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = expenses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  /* ================= DELETE ================= */
  const handleDelete = async (expenseId) => {
    const confirmDelete = window.confirm("Delete this expense?");
    if (!confirmDelete) return;

    try {
      const db = getDatabase(app);
      await remove(ref(db, `expenseList/${user.uid}/${expenseId}`));
    } catch (err) {
      alert("Failed to delete expense");
      console.error(err);
    }
  };

  return (
    <div className="h-full w-full p-6">
      <h1 className="text-2xl font-bold mb-4">Expense</h1>

      {/* SUMMARY */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow p-4 flex justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Expense</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {expenses.length} records
          </div>
        </div>
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={() => setShowPopup(true)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Expense
      </button>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        {loading && <div className="text-gray-500">Loading...</div>}
        {error && <div className="text-red-500">{error.message}</div>}

        {expenses.length === 0 ? (
          <div className="text-gray-500">No expense records found.</div>
        ) : (
          <>
            <table className="w-full table-auto">
              <thead className="border-b text-sm bg-gray-50">
                <tr>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Source</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-center py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b text-sm">
                    <td className="py-2">{expense.date}</td>
                    <td className="py-2">{expense.description}</td>
                    <td className="py-2">{expense.expenseCategory}</td>
                    <td className="py-2">{expense.sourceCategory}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-2 text-center">
                      <button
                        className="text-green-600 mr-2"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setSelectedExpenseId(expense.id);
                          setOpenEdit(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      |
                      <button
                        className="text-red-600 ml-2"
                        onClick={() => handleDelete(expense.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page
                        ? "bg-orange-500 text-white"
                        : ""
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* ADD POPUP */}
      {showPopup && (
        <ExpensePopup
          open={showPopup}
          onClose={() => setShowPopup(false)}
        />
      )}

      {/* EDIT POPUP */}
      {openEdit && (
        <ExpenseUpdatePopup
          open={openEdit}
          expenseData={selectedExpense}
          expenseId={selectedExpenseId}
          onClose={() => setOpenEdit(false)}
        />
      )}
    </div>
  );
}

export default ExpensePage;
