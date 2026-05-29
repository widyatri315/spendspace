import React, { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app } from "../firebase.js";
import IncomePopup from "./incomePopup";
import IncomeUpdatePopup from "./updateIncome";
import {
  getDatabase,
  ref,
  get,
  remove,
  onValue,
} from "firebase/database";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function IncomePage() {
  const [user, loading, error] = useAuthState(auth);

  /* ================= STATE ================= */
  const [incomes, setIncomes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [selectedIncomeId, setSelectedIncomeId] = useState(null);

  /* FILTER */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const db = getDatabase(app);
      const incomeRef = ref(db, `incomeList/${user.uid}`);

      const snapshot = await get(incomeRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        const list = Object.entries(data).map(([id, item]) => ({
          id,
          ...item,
        }));

        list.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setIncomes(list);
      } else {
        setIncomes([]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= REALTIME LISTENER ================= */
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

        list.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setIncomes(list);
      } else {
        setIncomes([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  /* ================= DELETE ================= */
  const handleDelete = async (incomeId) => {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus income ini?"
    );

    if (!confirmDelete) return;

    try {
      const db = getDatabase(app);

      await remove(
        ref(db, `incomeList/${user.uid}/${incomeId}`)
      );

      alert("Income berhasil dihapus");
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus income");
    }
  };

  /* ================= FILTER ================= */
  const filteredIncomes = incomes.filter((item) => {
    const matchSearch =
      item.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.sourceCategory
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchMonth =
      selectedMonth === "all"
        ? true
        : item.date?.startsWith(selectedMonth);

    return matchSearch && matchMonth;
  });

  /* ================= TOTAL ================= */
  const totalIncome = filteredIncomes.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  /* ================= MONTH OPTIONS ================= */
  const monthOptions = [
    ...new Set(
      incomes.map((item) => item.date?.slice(0, 7))
    ),
  ].sort().reverse();

  /* ================= PAGINATION ================= */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentIncomes = filteredIncomes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(
    filteredIncomes.length / itemsPerPage
  );

  return (
    <div className="h-full w-full p-6">
      <div className="mx-auto">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            Income
          </h2>

          <button
            onClick={() => setShowPopup(true)}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm"
          >
            + Add Income
          </button>
        </div>

        {/* ================= FILTER & SEARCH ================= */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">

            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search description or source..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-lg px-4 py-2 w-full md:w-1/2"
            />

            {/* MONTH FILTER */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-lg px-4 py-2 w-full md:w-60"
            >
              <option value="all">
                All Months
              </option>

              {monthOptions.map((month) => (
                <option
                  key={month}
                  value={month}
                >
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">
                Total Income
              </div>

              <div className="text-2xl font-bold">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {filteredIncomes.length} records
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-lg shadow p-4">

          {loading && (
            <div className="text-gray-500">
              Loading...
            </div>
          )}

          {error && (
            <div className="text-red-500">
              {error.message}
            </div>
          )}

          {filteredIncomes.length === 0 ? (
            <div className="text-gray-500">
              No income records found.
            </div>
          ) : (
            <>
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b text-sm text-gray-600">
                    <th className="text-left py-2">
                      Date
                    </th>

                    <th className="text-left py-2">
                      Description
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
                  {currentIncomes.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b"
                    >
                      <td className="py-2">
                        {item.date}
                      </td>

                      <td className="py-2">
                        {item.description}
                      </td>

                      <td className="py-2">
                        {item.sourceCategory}
                      </td>

                      <td className="py-2 text-right">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="py-2 text-center">
                        {/* EDIT */}
                        <button
                          className="text-green-600 mr-2"
                          onClick={() => {
                            setSelectedIncome(item);
                            setSelectedIncomeId(item.id);
                            setOpenEdit(true);
                          }}
                        >
                          ✏️ Edit
                        </button>

                        {/* DELETE */}
                        <button
                          className="text-red-600 ml-2"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ================= PAGINATION ================= */}
              <div className="flex justify-center items-center gap-2 mt-4">

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
                    className={`px-3 py-1 rounded border ${
                      currentPage === page
                        ? "bg-orange-500 text-white"
                        : "bg-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={
                    currentPage === totalPages
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
      </div>

      {/* ================= ADD POPUP ================= */}
      {showPopup && (
        <IncomePopup
          open={showPopup}
          onClose={() => {
            setShowPopup(false);
            fetchData();
          }}
        />
      )}

      {/* ================= EDIT POPUP ================= */}
      {openEdit && (
        <IncomeUpdatePopup
          open={openEdit}
          incomeData={selectedIncome}
          incomeId={selectedIncomeId}
          onClose={() => {
            setOpenEdit(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

export default IncomePage;