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

function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const [userFullName, setUserFullName] = useState("");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState([]);

  // ✅ helper HARUS di luar hook
  const groupByMonth = (data) => {
    const result = {};

    Object.values(data).forEach((item) => {
      if (!item.date) return;
      const month = item.date.slice(0, 7); // YYYY-MM
      result[month] = (result[month] || 0) + Number(item.amount || 0);
    });

    return result;
  };

  // ================= TOTAL INCOME & EXPENSE =================
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const unsubIncome = onValue(incomeRef, (snap) => {
      const total = snap.exists()
        ? Object.values(snap.val()).reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          )
        : 0;
      setTotalIncome(total);
    });

    const unsubExpense = onValue(expenseRef, (snap) => {
      const total = snap.exists()
        ? Object.values(snap.val()).reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          )
        : 0;
      setTotalExpense(total);
    });

    return () => {
      unsubIncome();
      unsubExpense();
    };
  }, [user]);

  // ================= CHART DATA =================
  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const incomeRef = ref(db, `incomeList/${user.uid}`);
    const expenseRef = ref(db, `expenseList/${user.uid}`);

    const unsubIncome = onValue(incomeRef, (incomeSnap) => {
      const unsubExpense = onValue(expenseRef, (expenseSnap) => {
        const incomeData = incomeSnap.exists() ? incomeSnap.val() : {};
        const expenseData = expenseSnap.exists() ? expenseSnap.val() : {};

        const incomeMonthly = groupByMonth(incomeData);
        const expenseMonthly = groupByMonth(expenseData);

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

  // ================= BALANCE =================
  useEffect(() => {
    setBalance(totalIncome - totalExpense);
  }, [totalIncome, totalExpense]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="text-sm text-gray-600 pb-5">
              Hello, {userFullName || user?.email || "User"} This is your cash flow summary
            </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-xl font-bold text-green-700">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expense</p>
          <p className="text-xl font-bold text-red-700">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Balance</p>
          <p
            className={`text-xl font-bold ${
              balance < 0 ? "text-red-600" : "text-blue-700"
            }`}
          >
            {formatCurrency(balance)}
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
    </div>
  );
}

export default Dashboard;
