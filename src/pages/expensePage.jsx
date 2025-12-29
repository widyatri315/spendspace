//expense page
import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";  
import { auth, app } from "../firebase.js";
import ExpensePopup from "./expensePopup.jsx";
import { getDatabase, ref, get, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

function ExpensePage() {
    const [user, loading, error] = useAuthState(auth);
    const [expenses, setExpenses] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [selectedExpenseId, setSelectedExpenseId] = useState(null);
    const [selectedSourceCategory, setSelectedSourceCategory] = useState("");
    const [userFullName, setUserFullName] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    //button to fetch data
    const fetchData = async () => {
        try {
            if (!user) {
                setExpenses([]);
                return;
            }
            const rtdb = getDatabase(app);
            const expenseListRef = ref(rtdb, `expenseList/${user.uid}`); // <-- per-user read
            const snapshot = await get(expenseListRef);
            if (snapshot.exists()) {
                const val = snapshot.val();
                const list = Object.entries(val).map(([id, item]) => ({ id, ...item }));
                setExpenses(list.reverse());
            } else {
                setExpenses([]);
            }
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    // fetch display name (ke Firestore users collection) — unchanged
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
                setExpenses(list.reverse());
            } else {
                setExpenses([]);
            }
        });
        return () => unsubscribe();
    }, [user]);

    //total expense calculation
    const totalExpense = expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
    //pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentExpenses = expenses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(expenses.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Expense</h1>
            <div className="mb-4">
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                <div className="text-sm text-gray-500">Total Expense</div>
                <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
                </div>
                <div className="text-sm text-gray-500">{expenses.length} records</div>
            </div>
            </div>

            <button onClick={() => setShowPopup(true)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">Add Expense</button>
            <table className="w-full table-auto">
              <thead className="text-sm text-body border-b border-default">
                <tr className="px-6 py-3 bg-neutral-secondary-soft font-medium">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Expense Item</th>
                  <th className="text-left py-2">Source</th>
                  <th className="text-right py-2">Amount</th>
                  
                  <th className="text-center py-2">Actions</th>
                </tr>
              </thead>
              <tbody></tbody>
                <tbody>
                    {currentExpenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-default">
                            <td className="px-3 py-2">{expense.date}</td>
                            <td className="px-3 py-2">{expense.description}</td>
                            <td className="px-3 py-2">{expense.expenseCategory}</td>
                            <td className="px-3 py-2">{expense.sourceCategory}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(expense.amount)}</td>
                            <td className="px-3 py-2 text-right">
                        <button className="mr-2 text-green-500" 
                    ><span className="mr-1">✏️</span> Edit
                      </button>
                      ||
                      <button className="ml-2 text-red-500" 
                      ><span className="mr-1">🗑️</span>
                        Delete
                      </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-center mt-4">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="mx-1 px-3 py-1 bg-gray-300 rounded">Prev</button>
                {[...Array(totalPages)].map((_, index) => (
                    <button key={index} onClick={() => paginate(index + 1)} className={`mx-1 px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>{index + 1}</button>
                ))}
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="mx-1 px-3 py-1 bg-gray-300 rounded">Next</button>
            </div>
            <ExpensePopup open={showPopup} onClose={() => {setShowPopup(false); fetchData();}} />
        </div>
    );
}

export default ExpensePage;