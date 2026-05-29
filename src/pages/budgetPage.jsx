/* =========================================================
   MONTHLY BUDGET SYSTEM (CLEAR VERSION)

   ✅ Budget otomatis per bulan
   ✅ Overall budget hanya bulan aktif
   ✅ Budget progress reset tiap bulan
   ✅ Budget Left
   ✅ Daily Safe Spending
========================================================= */

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
} from "firebase/database";

/* ================= HELPERS ================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getCurrentMonth = () => {
  const d = new Date();
  return d.toISOString().slice(0, 7);
};

const getRemainingDays = () => {
  const now = new Date();

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  return lastDay - now.getDate();
};

/* ================= COMPONENT ================= */

function BudgetPage() {
  const [user] = useAuthState(auth);

  /* ================= STATE ================= */

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [showPopup, setShowPopup] = useState(false);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const [editingId, setEditingId] = useState(null);

  /* ================= CATEGORY ================= */

  const expenseCategory = [
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

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!user) return;

    const db = getDatabase();

    const budgetRef = ref(db, `budgets/${user.uid}`);

    const expenseRef = ref(
      db,
      `expenseList/${user.uid}`
    );

    const currentMonth = getCurrentMonth();

    /* ===== LOAD BUDGET ===== */

    const unsubBudget = onValue(
      budgetRef,
      (snap) => {
        if (snap.exists()) {
          const data = Object.entries(
            snap.val()
          )
            .map(([id, item]) => ({
              id,
              ...item,
            }))
            .filter(
              (item) =>
                item.month === currentMonth
            );

          setBudgets(data);
        } else {
          setBudgets([]);
        }
      }
    );

    /* ===== LOAD EXPENSE ===== */

    const unsubExpense = onValue(
      expenseRef,
      (snap) => {
        if (snap.exists()) {
          const data = Object.values(
            snap.val()
          ).filter((item) =>
            item.date?.startsWith(
              currentMonth
            )
          );

          setExpenses(data);
        } else {
          setExpenses([]);
        }
      }
    );

    return () => {
      unsubBudget();
      unsubExpense();
    };
  }, [user]);

  /* ================= SAVE ================= */

  const handleSaveBudget = async () => {
    if (!category || !amount) {
      alert("Please fill all fields");
      return;
    }

    try {
      const db = getDatabase();

      const currentMonth =
        getCurrentMonth();

      /* ===== EDIT ===== */

      if (editingId) {
        await update(
          ref(
            db,
            `budgets/${user.uid}/${editingId}`
          ),
          {
            category,
            amount: Number(amount),
            month: currentMonth,
          }
        );
      }

      /* ===== ADD ===== */

      else {
        const newBudgetRef = push(
          ref(db, `budgets/${user.uid}`)
        );

        await set(newBudgetRef, {
          category,
          amount: Number(amount),
          month: currentMonth,
          createdAt: Date.now(),
        });
      }

      /* ===== RESET ===== */

      setCategory("");
      setAmount("");
      setEditingId(null);

      setShowPopup(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save budget");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this budget?"
    );

    if (!confirmDelete) return;

    try {
      const db = getDatabase();

      await remove(
        ref(db, `budgets/${user.uid}/${id}`)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  /* ================= CALCULATE ================= */

  const totalBudget = budgets.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const overallPercentage =
    totalBudget > 0
      ? Math.min(
          (totalExpense / totalBudget) *
            100,
          100
        )
      : 0;

  /* ===== BUDGET LEFT ===== */

  const budgetLeft =
    totalBudget - totalExpense;

  /* ===== DAILY SAFE SPENDING ===== */

  const remainingDays =
    getRemainingDays();

  const safeDailySpending =
    remainingDays > 0
      ? budgetLeft / remainingDays
      : budgetLeft;

  /* ================= CATEGORY EXPENSE ================= */

  const getCategoryExpense = (
    categoryName
  ) => {
    return expenses
      .filter(
        (item) =>
          item.expenseCategory ===
          categoryName
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );
  };

  /* ================= UI ================= */

  return (
    <div className="p-4">

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Budgeting
          </h1>

          <p className="text-sm text-gray-500">
            Monthly budget tracking
          </p>
        </div>

        <button
          onClick={() => {
            setShowPopup(true);

            setEditingId(null);

            setCategory("");
            setAmount("");
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Add Budget
        </button>
      </div>

      {/* ================= OVERVIEW ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* TOTAL BUDGET */}

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-sm text-gray-500">
            Total Budget
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {formatCurrency(totalBudget)}
          </h2>
        </div>

        {/* BUDGET LEFT */}

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-sm text-gray-500">
            Budget Left
          </p>

          <h2
            className={`text-2xl font-bold mt-2 ${
              budgetLeft < 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {formatCurrency(budgetLeft)}
          </h2>
        </div>

        {/* SAFE DAILY */}

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-sm text-gray-500">
            Safe Daily Spending
          </p>

          <h2 className="text-2xl font-bold mt-2 text-blue-600">
            {formatCurrency(
              safeDailySpending
            )}
          </h2>
        </div>
      </div>

      {/* ================= OVERALL PROGRESS ================= */}

      <div className="bg-white p-5 rounded-xl shadow mb-6">

        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">
            Monthly Budget Progress
          </h2>

          <span className="text-sm text-gray-500">
            {formatCurrency(totalExpense)} /{" "}
            {formatCurrency(totalBudget)}
          </span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              overallPercentage >= 100
                ? "bg-red-500"
                : overallPercentage >= 80
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{
              width: `${overallPercentage}%`,
            }}
          />
        </div>

        <p className="text-sm mt-3 text-gray-600">
          {overallPercentage.toFixed(0)}%
          used this month
        </p>
      </div>

      {/* ================= CATEGORY BUDGET ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {budgets.map((budget) => {
          const used =
            getCategoryExpense(
              budget.category
            );

          const percentage =
            budget.amount > 0
              ? Math.min(
                  (used / budget.amount) *
                    100,
                  100
                )
              : 0;

          return (
            <div
              key={budget.id}
              className="bg-white p-5 rounded-xl shadow"
            >
              <div className="flex justify-between items-center mb-2">

                <h3 className="font-semibold">
                  {budget.category}
                </h3>

                <span className="text-sm text-gray-500">
                  {formatCurrency(used)} /{" "}
                  {formatCurrency(
                    budget.amount
                  )}
                </span>
              </div>

              {/* PROGRESS */}

              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    percentage >= 100
                      ? "bg-red-500"
                      : percentage >= 80
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <p className="text-sm mt-2 text-gray-600">
                {percentage.toFixed(0)}%
                used
              </p>

              {/* ACTION */}

              <div className="flex gap-3 mt-4">

                <button
                  onClick={() => {
                    setEditingId(
                      budget.id
                    );

                    setCategory(
                      budget.category
                    );

                    setAmount(
                      budget.amount
                    );

                    setShowPopup(true);
                  }}
                  className="text-blue-600 text-sm"
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(
                      budget.id
                    )
                  }
                  className="text-red-600 text-sm"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= POPUP ================= */}

      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">
              {editingId
                ? "Edit Budget"
                : "Add Budget"}
            </h2>

            <div className="flex flex-col gap-4">

              {/* CATEGORY */}

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              >
                <option value="">
                  Select Category
                </option>

                {expenseCategory.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

              {/* AMOUNT */}

              <input
                type="number"
                placeholder="Budget Amount"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              {/* BUTTON */}

              <div className="flex justify-end gap-3">

                <button
                  onClick={() =>
                    setShowPopup(false)
                  }
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleSaveBudget
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetPage;