import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Receipt, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

import { db, auth } from "../firebase/firebase";
import Sidebar        from "../components/Sidebar";
import Navbar         from "../components/Navbar";
import AddTransaction from "../components/AddTransaction";
import Transactions   from "../components/Transactions";
import ExpenseChart   from "../components/ExpenseChart";
import FinanceProgress from "../components/FinanceProgress";

const card = (i) => ({
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
});

function MainContent() {
  const [transactions, setTransactions] = useState([]);
  const [editData, setEditData]         = useState(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [darkMode, setDarkMode]         = useState(true);
  const [loading, setLoading]           = useState(true);

  // Apply light/dark to body
  useEffect(() => {
    document.body.classList.toggle("light", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
      // Sort by id desc (most recent first)
      data.sort((a, b) => b.id - a.id);
      setTransactions(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const income   = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense  = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const balance  = income + expense;

  const highestIncome  = transactions.length > 0 ? Math.max(...transactions.map((t) => t.amount)) : 0;
  const highestExpense = transactions.length > 0 ? Math.min(...transactions.map((t) => t.amount)) : 0;

  const filtered = transactions.filter((t) => {
    const matchSearch   = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "All" || t.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

  const STATS = [
    {
      label: "Total Balance",
      value: `${balance >= 0 ? "" : "-"}${fmt(balance)}`,
      icon: Wallet,
      colorClass: "blue",
      accentClass: "accent-blue",
      valueClass: balance >= 0 ? "positive" : "negative",
    },
    {
      label: "Total Income",
      value: fmt(income),
      icon: TrendingUp,
      colorClass: "teal",
      accentClass: "accent-teal",
      valueClass: "positive",
    },
    {
      label: "Total Expense",
      value: fmt(expense),
      icon: TrendingDown,
      colorClass: "red",
      accentClass: "accent-red",
      valueClass: "negative",
    },
    {
      label: "Transactions",
      value: transactions.length,
      icon: Receipt,
      colorClass: "gold",
      accentClass: "accent-gold",
      valueClass: "",
    },
    {
      label: "Highest Income",
      value: fmt(highestIncome),
      icon: ArrowUpCircle,
      colorClass: "teal",
      accentClass: "accent-teal",
      valueClass: "positive",
    },
    {
      label: "Highest Expense",
      value: fmt(highestExpense),
      icon: ArrowDownCircle,
      colorClass: "red",
      accentClass: "accent-red",
      valueClass: "negative",
    },
  ];

  return (
    <div className="app-layout">
      <Sidebar active="Dashboard" />

      <div className="main-area">
        <Navbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="page-content">
          <div className="page-header">
            <h1>Dashboard</h1>
            <p>Track your income, expenses, and financial health.</p>
          </div>

          {/* Stat Cards */}
          <motion.div
            className="cards-grid"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {STATS.map(({ label, value, icon: Icon, colorClass, accentClass, valueClass }, i) => (
              <motion.div key={label} className={`stat-card ${accentClass}`} variants={card(i)}>
                <div className={`stat-card-icon ${colorClass}`}><Icon /></div>
                <div className="stat-label">{label}</div>
                <div className={`stat-value ${valueClass}`}>{loading ? "—" : value}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts row */}
          <div className="chart-row">
            <ExpenseChart transactions={transactions} />
            <FinanceProgress income={income} expense={expense} />
          </div>

          {/* Add/Edit form */}
          <AddTransaction
            transactions={transactions}
            setTransactions={setTransactions}
            editData={editData}
            setEditData={setEditData}
          />

          {/* Transaction list */}
          <Transactions
            transactions={filtered}
            setTransactions={setTransactions}
            setEditData={setEditData}
          />
        </div>
      </div>
    </div>
  );
}

export default MainContent;
