import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { getDatabase, ref, onValue } from "firebase/database";
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
  return d.toISOString().slice(0, 7); // YYYY-MM
};

const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const calculateMonthlyTotal = (data, month) => {
  return Object.values(data || {}).reduce((sum, item) => {
    if (!item.date || !item.amount) return sum;
    return item.date.startsWith(month)
      ? sum + Number(item.amount)
      : sum;
  }, 0);
};

/**
 * Persentase aman:
 * hasil selalu -100% s/d +100%
 */
const calculateMonthComparisonPercentage = (current, previous) => {
  if (current === 0 && previous === 0) return 0;
  if (previous === 0 && current > 0) return 100;
  if (current === 0 && previous > 0) return -100;

  const diff = current - previous;
  const base = Math.max(current, previous);

  return Math.round((diff / base) * 100);
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
  

  /* ========== TOTAL BULAN INI ========== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);
    const currentMonth = getCurrentMonth();

    const unsubIncome = onValue(incomeRef, (snap) => {
      setTotalIncome(
        snap.exists()
          ? calculateMonthlyTotal(snap.val(), currentMonth)
          : 0
      );
    });

    const unsubExpense = onValue(expenseRef, (snap) => {
      setTotalExpense(
        snap.exists()
          ? calculateMonthlyTotal(snap.val(), currentMonth)
          : 0
      );
    });

    return () => {
      unsubIncome();
      unsubExpense();
    };
  }, [user]);

  /* ========== PERSENTASE INCOME ========== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);

    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();

    const unsub = onValue(incomeRef, (snap) => {
      if (!snap.exists()) {
        setIncomePercentage(0);
        return;
      }

      const data = snap.val();
      const current = calculateMonthlyTotal(data, currentMonth);
      const previous = calculateMonthlyTotal(data, previousMonth);

      setIncomePercentage(
        calculateMonthComparisonPercentage(current, previous)
      );
    });

    return () => unsub();
  }, [user]);

  /* ========== PERSENTASE EXPENSE ========== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();

    const unsub = onValue(expenseRef, (snap) => {
      if (!snap.exists()) {
        setExpensePercentage(0);
        return;
      }

      const data = snap.val();
      const current = calculateMonthlyTotal(data, currentMonth);
      const previous = calculateMonthlyTotal(data, previousMonth);

      setExpensePercentage(
        calculateMonthComparisonPercentage(current, previous)
      );
    });

    return () => unsub();
  }, [user]);

  /*=================History============*/
  useEffect(() => {
  if (!user) return;

  const db = getDatabase();
  const incomeRef = ref(db, `incomeList/${user.uid}`);
  const expenseRef = ref(db, `expenseList/${user.uid}`);

  const unsubIncome = onValue(incomeRef, (incomeSnap) => {
    const unsubExpense = onValue(expenseRef, (expenseSnap) => {
      const incomes = incomeSnap.exists()
        ? Object.entries(incomeSnap.val()).map(([id, item]) => ({
            id,
            type: "income",
            ...item,
          }))
        : [];

      const expenses = expenseSnap.exists()
        ? Object.entries(expenseSnap.val()).map(([id, item]) => ({
            id,
            type: "expense",
            ...item,
          }))
        : [];

      const merged = [...incomes, ...expenses]
        .filter((item) => item.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); //  hanya 10 terbaru

      setHistory(merged);
    });

    return () => unsubExpense();
  });

  return () => unsubIncome();
}, [user]);

  /* ========== BALANCE ========== */
useEffect(() => {
  if (!user) return;

  const db = getDatabase();
  const incomeRef = ref(db, `incomeList/${user.uid}`);
  const expenseRef = ref(db, `expenseList/${user.uid}`);

  const unsubIncome = onValue(incomeRef, (snap) => {
    let total = 0;
    if (snap.exists()) {
      Object.values(snap.val()).forEach((item) => {
        total += Number(item.amount || 0);
      });
    }
    setAllTimeIncome(total);
  });

  const unsubExpense = onValue(expenseRef, (snap) => {
    let total = 0;
    if (snap.exists()) {
      Object.values(snap.val()).forEach((item) => {
        total += Number(item.amount || 0);
      });
    }
    setAllTimeExpense(total);
  });

  return () => {
    unsubIncome();
    unsubExpense();
  };
}, [user]);

    useEffect(() => {
      setBalance(allTimeIncome - allTimeExpense);
    }, [allTimeIncome, allTimeExpense]);
  /* ========== CHART ========== */
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const unsubIncome = onValue(incomeRef, (incomeSnap) => {
      const unsubExpense = onValue(expenseRef, (expenseSnap) => {
        const incomeMonthly = groupByMonth(
          incomeSnap.exists() ? incomeSnap.val() : {}
        );
        const expenseMonthly = groupByMonth(
          expenseSnap.exists() ? expenseSnap.val() : {}
        );

        const months = new Set([
          ...Object.keys(incomeMonthly),
          ...Object.keys(expenseMonthly),
        ]);

        const formatted = Array.from(months)
          .sort()
          .map((month) => ({
            month,
            income: incomeMonthly[month] || 0,
            expense: expenseMonthly[month] || 0,
          }));

        setChartData(formatted);
      });

      return () => unsubExpense();
    });

    return () => unsubIncome();
  }, [user]);

  if (loading) return <p>Loading...</p>;


  


  /* ================= UI ================= */

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

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
            {incomePercentage}% dibanding bulan lalu
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
            {expensePercentage}% dibanding bulan lalu
          </p>
        </div>

       
      </div>

      {/* CHART */}
      <div className="bg-white mt-6 p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Grafik Keuangan Bulanan</h2>
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

      <div className="bg-white mt-6 p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Recent Transactions</h2>

        <div className="overflow-x-auto">
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
  );
}

export default Dashboard;
