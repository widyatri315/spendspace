import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { getDatabase, ref, onValue, get } from "firebase/database";
import ExpensePopup from "./expensePopup.jsx";
import IncomePopup from "./incomePopup.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/* ================= HELPERS ================= */
const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const calculateMonthlyTotal = (data, month) =>
  Object.values(data || {}).reduce((sum, item) => {
    if (!item.date || !item.amount) return sum;
    return item.date.startsWith(month) ? sum + Number(item.amount) : sum;
  }, 0);

const calculateMonthComparisonPercentage = (current, previous) => {
  if (current === 0 && previous === 0) return 0;
  if (previous === 0 && current > 0) return 100;
  if (current === 0 && previous > 0) return -100;
  return Math.round(((current - previous) / Math.max(current, previous)) * 100);
};

const groupByMonth = (data) => {
  const result = {};
  Object.values(data || {}).forEach((item) => {
    if (!item.date) return;
    const month = item.date.slice(0, 7);
    result[month] = (result[month] || 0) + Number(item.amount || 0);
  });
  return result;
};

/* ================= COMPONENT ================= */
function Dashboard() {
  const [user, loading] = useAuthState(auth);

  /* ================= STATE ================= */
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [allTimeIncome, setAllTimeIncome] = useState(0);
  const [allTimeExpense, setAllTimeExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [incomePercentage, setIncomePercentage] = useState(0);
  const [expensePercentage, setExpensePercentage] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState([]);
  const [userFullName, setUserFullName] = useState("");
  const [showIncomePopup, setShowIncomePopup] = useState(false);
  const [showExpensePopup, setShowExpensePopup] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [savingRate, setSavingRate] = useState(0);
  const [highestCategory, setHighestCategory] = useState({ category: "-", amount: 0 });

  /* ================= USER NAME ================= */
  useEffect(() => {
    if (!user) return;
    if (user.displayName) {
      setUserFullName(user.displayName);
      return;
    }
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}`);
    get(userRef).then((snap) => {
      if (snap.exists()) {
        setUserFullName(snap.val().fullName || "");
      }
    });
  }, [user]);

  /* ================= TOTAL MONTH ================= */
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);
    const currentMonth = getCurrentMonth();

    const unsub1 = onValue(incomeRef, (snap) => {
      setTotalIncome(snap.exists() ? calculateMonthlyTotal(snap.val(), currentMonth) : 0);
    });

    const unsub2 = onValue(expenseRef, (snap) => {
      setTotalExpense(snap.exists() ? calculateMonthlyTotal(snap.val(), currentMonth) : 0);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  /* ================= SAVING RATE ================= */
  useEffect(() => {
    if (totalIncome <= 0) {
      setSavingRate(0);
      return;
    }
    const saved = totalIncome - totalExpense;
    const rate = (saved / totalIncome) * 100;
    setSavingRate(Math.max(rate, 0));
  }, [totalIncome, totalExpense]);

  /* ================= BUDGET & HIGHEST CATEGORY ================= */
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const budgetRef = ref(db, `budgets/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);
    const currentMonth = getCurrentMonth();
    let expensesData = [];

    const unsubBudget = onValue(budgetRef, (snap) => {
      const budgets = snap.exists()
        ? Object.values(snap.val()).filter((item) => item.month === currentMonth)
        : [];
      const total = budgets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      setTotalBudget(total);
    });

    const unsubExpense = onValue(expenseRef, (snap) => {
      expensesData = snap.exists() ? Object.values(snap.val()) : [];

      // Calculate budget used
      const used = expensesData.reduce((sum, item) => {
        if (item.date?.startsWith(currentMonth)) {
          return sum + Number(item.amount || 0);
        }
        return sum;
      }, 0);
      setBudgetUsed(used);

      // Calculate highest category
      const categoryMap = {};
      expensesData.forEach((item) => {
        if (item.date?.startsWith(currentMonth)) {
          const category = item.expenseCategory || "Others";
          categoryMap[category] = (categoryMap[category] || 0) + Number(item.amount || 0);
        }
      });

      let highest = { category: "-", amount: 0 };
      Object.entries(categoryMap).forEach(([category, amount]) => {
        if (amount > highest.amount) {
          highest = { category, amount };
        }
      });
      setHighestCategory(highest);
    });

    return () => {
      unsubBudget();
      unsubExpense();
    };
  }, [user]);

  /* ================= CHART ================= */
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);
    let incomeData = {};
    let expenseData = {};

    const updateChart = () => {
      const incomeByMonth = groupByMonth(incomeData);
      const expenseByMonth = groupByMonth(expenseData);
      const months = new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)]);
      const data = Array.from(months)
        .sort()
        .map((month) => ({
          month,
          income: incomeByMonth[month] || 0,
          expense: expenseByMonth[month] || 0,
        }));
      setChartData(data);
    };

    const unsub1 = onValue(incomeRef, (snap) => {
      incomeData = snap.val() || {};
      updateChart();
    });

    const unsub2 = onValue(expenseRef, (snap) => {
      expenseData = snap.val() || {};
      updateChart();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  /* ================= HISTORY (20 RECENT TRANSACTIONS) ================= */
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const fetchHistory = async () => {
      const incomeSnap = await get(incomeRef);
      const expenseSnap = await get(expenseRef);
      const transactions = [];

      if (incomeSnap.exists()) {
        Object.entries(incomeSnap.val()).forEach(([id, item]) => {
          transactions.push({ id, type: "income", date: item.date, amount: item.amount });
        });
      }

      if (expenseSnap.exists()) {
        Object.entries(expenseSnap.val()).forEach(([id, item]) => {
          transactions.push({ id, type: "expense", date: item.date, amount: item.amount });
        });
      }

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(transactions.slice(0, 5)); // Show 5 recent
    };

    fetchHistory();
  }, [user]);

  /* ================= COMPARISON ================= */
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);
    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();

    const unsub1 = onValue(incomeRef, (snap) => {
      const current = calculateMonthlyTotal(snap.val(), currentMonth);
      const previous = calculateMonthlyTotal(snap.val(), previousMonth);
      setIncomePercentage(calculateMonthComparisonPercentage(current, previous));
    });

    const unsub2 = onValue(expenseRef, (snap) => {
      const current = calculateMonthlyTotal(snap.val(), currentMonth);
      const previous = calculateMonthlyTotal(snap.val(), previousMonth);
      setExpensePercentage(calculateMonthComparisonPercentage(current, previous));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  /* ================= BALANCE ================= */
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const unsub1 = onValue(incomeRef, (snap) => {
      let total = 0;
      if (snap.exists()) {
        Object.values(snap.val()).forEach((item) => {
          total += Number(item.amount || 0);
        });
      }
      setAllTimeIncome(total);
    });

    const unsub2 = onValue(expenseRef, (snap) => {
      let total = 0;
      if (snap.exists()) {
        Object.values(snap.val()).forEach((item) => {
          total += Number(item.amount || 0);
        });
      }
      setAllTimeExpense(total);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  useEffect(() => {
    setBalance(allTimeIncome - allTimeExpense);
  }, [allTimeIncome, allTimeExpense]);

  if (loading) return <p>Loading...</p>;

  /* ================= CALCULATE PERCENTAGES ================= */
  const budgetPercentage = totalBudget > 0 ? Math.min((budgetUsed / totalBudget) * 100, 100) : 0;

  /* ================= RENDER ================= */
 /* ================= RENDER ================= */
return (
  <div className="p-4">
    {/* HEADER */}
    <h1 className="text-2xl font-bold mb-2">
      Greetings 👋 {userFullName || user?.email}
    </h1>

    <p className="text-sm mb-6 text-gray-500">
      Don't waste money, save every penny!
    </p>

    {/* ================= SUMMARY ================= */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* BALANCE */}
      <div className="bg-blue-100 p-4 rounded-xl shadow">
        <p className="text-sm text-gray-600">
          Balance
        </p>

        <p className="text-2xl font-bold text-blue-700 mt-2">
          {formatCurrency(balance)}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {balance >= 0
            ? "Financial status healthy"
            : "Expenses exceed income"}
        </p>
      </div>

      {/* INCOME */}
      <div className="bg-green-100 p-4 rounded-xl shadow">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Income
          </p>

          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              incomePercentage >= 0
                ? "bg-green-200 text-green-700"
                : "bg-red-200 text-red-700"
            }`}
          >
            {incomePercentage > 0 ? "+" : ""}
            {incomePercentage}%
          </span>
        </div>

        <p className="text-2xl font-bold text-green-700 mt-2">
          {formatCurrency(totalIncome)}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          Current month income
        </p>
      </div>

      {/* EXPENSE */}
      <div className="bg-red-100 p-4 rounded-xl shadow">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Expense
          </p>

          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              expensePercentage > 0
                ? "bg-red-200 text-red-700"
                : "bg-green-200 text-green-700"
            }`}
          >
            {expensePercentage > 0 ? "+" : ""}
            {expensePercentage}%
          </span>
        </div>

        <p className="text-2xl font-bold text-red-700 mt-2">
          {formatCurrency(totalExpense)}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          Current month expense
        </p>
      </div>

      {/* SAVING RATE */}
      <div className="bg-yellow-100 p-4 rounded-xl shadow">
        <p className="text-sm text-gray-600">
          Saving Rate
        </p>

        <p className="text-2xl font-bold text-yellow-700 mt-2">
          {savingRate.toFixed(0)}%
        </p>

        <p className="text-xs text-gray-500 mt-1">
          Percentage of income saved
        </p>
      </div>
    </div>

    {/* ================= INSIGHTS ================= */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      
      {/* OVERALL BUDGET */}
      <div className="bg-white p-5 rounded-xl shadow">
        <div className="flex justify-between mb-2">
          <h2 className="font-semibold">
            Overall Budget
          </h2>

          <span className="text-sm text-gray-500">
            {budgetPercentage.toFixed(0)}%
          </span>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              budgetPercentage >= 100
                ? "bg-red-500"
                : budgetPercentage >= 80
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>

        <p className="text-sm mt-3 text-gray-500">
          {formatCurrency(budgetUsed)} /{" "}
          {formatCurrency(totalBudget)}
        </p>

        <p className="text-xs text-gray-400 mt-1">
          Remaining:{" "}
          {formatCurrency(totalBudget - budgetUsed)}
        </p>
      </div>

      {/* HIGHEST SPENDING */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-semibold mb-2">
          Highest Spending
        </h2>

        <p className="text-lg font-bold text-red-600">
          {highestCategory.category}
        </p>

        <p className="text-sm text-gray-500 mt-1">
          {formatCurrency(highestCategory.amount)}
        </p>

        <p className="text-xs text-gray-400 mt-1">
          Highest expense category this month
        </p>
      </div>

      {/* BUDGET WARNING */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-semibold mb-2">
          Budget Warning
        </h2>

        {budgetPercentage >= 100 ? (
          <p className="text-red-600 font-medium">
            You exceeded your budget!
          </p>
        ) : budgetPercentage >= 80 ? (
          <p className="text-yellow-600 font-medium">
            Budget almost full
          </p>
        ) : (
          <p className="text-green-600 font-medium">
            Budget still healthy
          </p>
        )}
      </div>
    </div>

    {/* ================= CHART + SIDE PANEL ================= */}
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
      
      {/* CHART */}
      <div className="bg-white p-4 rounded-lg shadow lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">
              Monthly Financial Chart
            </h2>

            <p className="text-sm text-gray-500">
              Income vs Expense overview
            </p>
          </div>

          <div className="text-sm text-gray-500">
            {getCurrentMonth()}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip
              formatter={(value) =>
                formatCurrency(value)
              }
            />

            <Line
              type="monotone"
              dataKey="income"
              stroke="#16a34a"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="expense"
              stroke="#dc2626"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SIDE PANEL */}
      <div className="flex flex-col gap-4">
        
        {/* QUICK ACTION */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">
            Quick Action
          </h3>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowExpensePopup(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 transition text-white rounded text-sm"
            >
              + Add Expense
            </button>

            <button
              onClick={() => setShowIncomePopup(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 transition text-white rounded text-sm"
            >
              + Add Income
            </button>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-4">
            Recent Transactions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="text-left py-2">
                    Date
                  </th>

                  <th className="text-left py-2">
                    Type
                  </th>

                  <th className="text-right py-2">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center py-4 text-gray-400"
                    >
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-none"
                    >
                      <td className="py-2">
                        {new Date(item.date).toLocaleDateString(
                          "id-ID"
                        )}
                      </td>

                      <td
                        className={`py-2 font-medium ${
                          item.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "income"
                          ? "Income"
                          : "Expense"}
                      </td>

                      <td
                        className={`py-2 text-right font-semibold ${
                          item.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "income"
                          ? "+"
                          : "-"}

                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* ================= POPUPS ================= */}
    {showIncomePopup && (
      <IncomePopup
        open={showIncomePopup}
        onClose={() => setShowIncomePopup(false)}
      />
    )}

    {showExpensePopup && (
      <ExpensePopup
        open={showExpensePopup}
        onClose={() => setShowExpensePopup(false)}
      />
    )}
  </div>
);
}

export default Dashboard;