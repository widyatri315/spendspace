import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { getDatabase, ref, onValue, get } from "firebase/database";
import ExpensePopup from "./expensePopup.jsx";
import IncomePopup from "./incomePopup.jsx";
import { useLocation } from "react-router-dom";
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

const getCurrentMonth = () => {
  const d = new Date();
  return d.toISOString().slice(0, 7);
};

const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const calculateMonthlyTotal = (data, month) =>
  Object.values(data || {}).reduce((sum, item) => {
    if (!item.date || !item.amount) return sum;
    return item.date.startsWith(month)
      ? sum + Number(item.amount)
      : sum;
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
  

  /* ===== USER NAME ===== */
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

  /* ===== TOTAL BULAN INI ===== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);
    const currentMonth = getCurrentMonth();

    const unsub1 = onValue(incomeRef, (snap) =>
      setTotalIncome(
        snap.exists() ? calculateMonthlyTotal(snap.val(), currentMonth) : 0
      )
    );

    const unsub2 = onValue(expenseRef, (snap) =>
      setTotalExpense(
        snap.exists() ? calculateMonthlyTotal(snap.val(), currentMonth) : 0
      )
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

   /* ===== MONTHLY CHART DATA ===== */
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

    const months = new Set([
      ...Object.keys(incomeByMonth),
      ...Object.keys(expenseByMonth),
    ]);

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

   /* ===== RECENT TRANSACTIONS (INCOME + EXPENSE) ===== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const fetchHistory = async () => {
      const incomeSnap = await get(incomeRef);
      const expenseSnap = await get(expenseRef);

      const transactions = [];

      // add income
      if (incomeSnap.exists()) {
        Object.entries(incomeSnap.val()).forEach(([id, item]) => {
          transactions.push({
            id,
            type: "income",
            date: item.date,
            amount: item.amount,
          });
        });
      }

      // add expense
      if (expenseSnap.exists()) {
        Object.entries(expenseSnap.val()).forEach(([id, item]) => {
          transactions.push({
            id,
            type: "expense",
            date: item.date,
            amount: item.amount,
          });
        });
      }

      // sort by date desc, take 10 latest
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(transactions.slice(0, 10));
    };

    fetchHistory();
  }, [user]);

  /* ===== MONTHLY COMPARISON ===== */
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
      setIncomePercentage(
        calculateMonthComparisonPercentage(current, previous)
      );
    });

    const unsub2 = onValue(expenseRef, (snap) => {
      const current = calculateMonthlyTotal(snap.val(), currentMonth);
      const previous = calculateMonthlyTotal(snap.val(), previousMonth);
      setExpensePercentage(
        calculateMonthComparisonPercentage(current, previous)
      );
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]); 

  /* ===== BALANCE ALL TIME ===== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const unsub1 = onValue(incomeRef, (snap) => {
      let total = 0;
      snap.exists() &&
        Object.values(snap.val()).forEach(
          (i) => (total += Number(i.amount || 0))
        );
      setAllTimeIncome(total);
    });

    const unsub2 = onValue(expenseRef, (snap) => {
      let total = 0;
      snap.exists() &&
        Object.values(snap.val()).forEach(
          (i) => (total += Number(i.amount || 0))
        );
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

  /* ================= UI ================= */

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Greetings 👋 {userFullName || user?.email} </h1>
      <p className="text-sm mb-4"> Dont waste money, save every penny!</p>

      <div className="grid grid-cols-3 gap-4">
         {/* BALANCE */}
        <div className="bg-blue-100 p-4 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">Balance</p>
          <p
            className={`text-xl font-bold ${
              balance < 0 ? "text-red-600" : "text-blue-700"
            }`}
          >
            {formatCurrency(balance)}
          </p>
        </div>
        {/* INCOME */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">Income (This Month)</p>
          <p className="text-xl font-bold text-green-700">
            {formatCurrency(totalIncome)}
          </p>
          <p
            className={`text-xs mt-1 ${
              incomePercentage >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {incomePercentage > 0 ? "+" : ""}
            {incomePercentage}% compared to last month
          </p>
        </div>

        {/* EXPENSE */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">Expense (This Month)</p>
          <p className="text-xl font-bold text-red-700">
            {formatCurrency(totalExpense)}
          </p>
          <p
            className={`text-xs mt-1 ${
              expensePercentage > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {expensePercentage > 0 ? "+" : ""}
            {expensePercentage}% compared to last month
          </p>
        </div>

       
      </div>

      {/* CHART */}
    {/* CHART + ACTION BOX */}
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
      
      {/* CHART BOX */}
      <div className="bg-white p-4 rounded-lg shadow lg:col-span-3">
        <h2 className="font-semibold mb-4">Monthly Financial Chart</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="income" stroke="#16a34a" />
            <Line type="monotone" dataKey="expense" stroke="#dc2626" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ACTION BOX */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-3 justify-start">
        <h3 className="font-semibold text-sm text-gray-600">
          Quick Action
        </h3>

        <button
          onClick={() => setShowExpensePopup(true)}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm"
        >
          + Add Expense
        </button>

        <button
          onClick={() => setShowIncomePopup(true)}
          className="px-4 py-2 bg-green-600 text-white rounded text-sm"
        >
          + Add Income
        </button>

        {/* RECENT TRANSCATION */}
        <div>
        <h2 className="font-semibold mb-4">Recent Transactions</h2>

        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    No transactions yet
                  </td>
                </tr>
              )}

              {history.map((item) => (
                <tr key={item.id} className="border-b last:border-none">
                  <td className="py-2">
                    {new Date(item.date).toLocaleDateString("id-ID")}
                  </td>
                  <td
                    className={`py-2 font-medium ${
                      item.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.type === "income" ? "Income" : "Expense"}
                  </td>

                  <td
                    className={`py-2 text-right font-semibold ${
                      item.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      

    </div>
    {/* RENDER POPUP */}
    {showIncomePopup && (
    <IncomePopup
    open={showIncomePopup}
    onClose={() => {
      setShowIncomePopup(false);
        window.location.reload();}} />)}

    {showExpensePopup && (
    <ExpensePopup
    open={showExpensePopup} 
    onClose={() => {
      setShowExpensePopup(false);
        window.location.reload();}} />)}
    </div>

  );
}

export default Dashboard;
