import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app } from "../firebase.js";

import ExpensePopup from "./expensePopup.jsx";
import ExpenseUpdatePopup from "./updateExpense.jsx";

import {
  getDatabase,
  ref,
  onValue,
  remove,
} from "firebase/database";

/* ================= FORMAT ================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

/* ================= CATEGORY ================= */

const expenseCategories = [
  "Food & Beverage",
  "Transportation",
  "Health",
  "Entertainment",
  "Education",
  "Shopping",
  "Bills & Utilities",
  "Groceries",
  "Travel",
  "Personal Care",
  "Others",
];

function ExpensePage() {
  const [user, loading, error] = useAuthState(auth);

  const [expenses, setExpenses] = useState([]);

  const [showPopup, setShowPopup] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);

  const [selectedExpense, setSelectedExpense] =
    useState(null);

  const [selectedExpenseId, setSelectedExpenseId] =
    useState(null);

  /* ================= FILTER ================= */

  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedMonth, setSelectedMonth] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("");

  /* ================= PAGINATION ================= */

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* ================= FETCH ================= */

  useEffect(() => {
    if (!user) return;

    const db = getDatabase(app);

    const expenseRef = ref(
      db,
      `expenseList/${user.uid}`
    );

    const unsubscribe = onValue(
      expenseRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          const list = Object.entries(data).map(
            ([id, item]) => ({
              id,
              ...item,
            })
          );

          list.sort(
            (a, b) =>
              new Date(b.date) - new Date(a.date)
          );

          setExpenses(list);
        } else {
          setExpenses([]);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  /* ================= FILTERED DATA ================= */

  const filteredExpenses = expenses.filter(
    (expense) => {
     const matchSearch =
        expense.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        expense.expenseCategory
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        expense.sourceCategory
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
     
      

      const matchMonth = selectedMonth
        ? expense.date?.slice(0, 7) ===
          selectedMonth
        : true;

      const matchCategory = selectedCategory
        ? expense.expenseCategory ===
          selectedCategory
        : true;

      return (
        matchSearch &&
        matchMonth &&
        matchCategory
      );
    }
  );

  /* ================= TOTAL ================= */

  const filteredTotalExpense =
    filteredExpenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  /* ================= PAGINATION ================= */

  const indexOfLast =
    currentPage * itemsPerPage;

  const indexOfFirst =
    indexOfLast - itemsPerPage;

  const currentExpenses =
    filteredExpenses.slice(
      indexOfFirst,
      indexOfLast
    );

  const totalPages = Math.ceil(
    filteredExpenses.length / itemsPerPage
  );

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Yakin hapus expense ini?"
    );

    if (!confirmDelete) return;

    try {
      const db = getDatabase(app);

      await remove(
        ref(
          db,
          `expenseList/${user.uid}/${id}`
        )
      );
    } catch (err) {
      alert("Gagal menghapus expense");

      console.error(err);
    }
  };

  return (
    <div className="h-full w-full p-6">

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Expense
        </h1>

        <button
          onClick={() => setShowPopup(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
        >
          + Add Expense
        </button>
      </div>

      {/* ================= SUMMARY ================= */}

      <div className="mb-4">
        <div className="bg-white rounded-lg shadow p-4 flex justify-between">
          <div>
            <div className="text-sm text-gray-500">
              Total Expense
            </div>

            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                filteredTotalExpense
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredExpenses.length} records
          </div>
        </div>
      </div>

      {/* ================= FILTER BAR ================= */}

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          />

          {/* MONTH FILTER */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          />

          {/* CATEGORY FILTER */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(
                e.target.value
              );

              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">
              All Categories
            </option>

            {expenseCategories.map((cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* RESET FILTER */}
        <div className="mt-4">
          <button
            onClick={() => {
              setSearch("");
              setSelectedMonth("");
              setSelectedCategory("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="bg-white rounded-lg shadow p-4">

        {loading && (
          <p className="text-gray-500">
            Loading...
          </p>
        )}

        {error && (
          <p className="text-red-500">
            {error.message}
          </p>
        )}

        {filteredExpenses.length === 0 ? (
          <p className="text-gray-500">
            No matching expense records found.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="text-left py-2">
                    Date
                  </th>

                  <th className="text-left py-2">
                    Description
                  </th>

                  <th className="text-left py-2">
                    Category
                  </th>

                  <th className="text-left py-2">
                    Source
                  </th>

                  <th className="text-right py-2">
                    Amount
                  </th>

                  <th className="text-center py-2">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentExpenses.map(
                  (expense) => (
                    <tr
                      key={expense.id}
                      className="border-b"
                    >
                      <td className="py-2">
                        {expense.date}
                      </td>

                      <td className="py-2">
                        {expense.description}
                      </td>

                      <td className="py-2">
                        {
                          expense.expenseCategory
                        }
                      </td>

                      <td className="py-2">
                        {
                          expense.sourceCategory
                        }
                      </td>

                      <td className="py-2 text-right font-semibold text-red-600">
                        {formatCurrency(
                          expense.amount
                        )}
                      </td>

                      <td className="py-2 text-center">
                        <button
                          className="text-green-600 mr-2 hover:text-green-700"
                          onClick={() => {
                            setSelectedExpense(
                              expense
                            );

                            setSelectedExpenseId(
                              expense.id
                            );

                            setOpenEdit(true);
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className="text-red-600 ml-2 hover:text-red-700"
                          onClick={() =>
                            handleDelete(
                              expense.id
                            )
                          }
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {/* ================= PAGINATION ================= */}

            <div className="flex justify-center gap-2 mt-4">

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((p) => p - 1)
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from(
                { length: totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={`px-3 py-1 border rounded ${
                    currentPage === page
                      ? "bg-orange-500 text-white"
                      : ""
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  setCurrentPage((p) => p + 1)
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* ================= POPUPS ================= */}

      {showPopup && (
        <ExpensePopup
          open={showPopup}
          onClose={() =>
            setShowPopup(false)
          }
        />
      )}

      {openEdit && (
        <ExpenseUpdatePopup
          open={openEdit}
          expenseData={selectedExpense}
          expenseId={selectedExpenseId}
          onClose={() =>
            setOpenEdit(false)
          }
        />
      )}
    </div>
  );
}

export default ExpensePage;