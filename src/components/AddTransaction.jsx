import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { Plus, Pencil, X, Tag } from "lucide-react";

const TX_TYPES = [
  { id: "credit", label: "Credit", hint: "Money received / income", color: "var(--income)",  sign: +1 },
  { id: "debit",  label: "Debit",  hint: "Money spent / expense",   color: "var(--expense)", sign: -1 },
];

const CREDIT_CATS = ["Salary", "Freelance", "Investment", "Gift", "Refund"];
const DEBIT_CATS  = ["Food", "Shopping", "Bills", "Transport", "Healthcare", "Entertainment", "Others"];

function AddTransaction({ transactions, setTransactions, editData, setEditData }) {
  const [txType, setTxType]         = useState("debit");
  const [title, setTitle]           = useState("");
  const [amount, setAmount]         = useState("");
  const [category, setCategory]     = useState("");
  const [customCat, setCustomCat]   = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const customRef = useRef(null);

  const categories = txType === "credit" ? CREDIT_CATS : DEBIT_CATS;

  // Track auth state so we always have the current user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setAmount(Math.abs(editData.amount));
      const type = editData.amount >= 0 ? "credit" : "debit";
      setTxType(type);
      const cats = type === "credit" ? CREDIT_CATS : DEBIT_CATS;
      if (cats.includes(editData.category)) {
        setCategory(editData.category);
        setShowCustom(false);
        setCustomCat("");
      } else {
        setCategory("Others");
        setShowCustom(true);
        setCustomCat(editData.category);
      }
    } else {
      resetForm();
    }
  }, [editData]);

  useEffect(() => {
    if (showCustom && customRef.current) customRef.current.focus();
  }, [showCustom]);

  useEffect(() => {
    if (!editData) {
      setCategory("");
      setShowCustom(false);
      setCustomCat("");
    }
  }, [txType]);

  const resetForm = () => {
    setTitle(""); setAmount(""); setCategory("");
    setCustomCat(""); setShowCustom(false);
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    if (val === "Others") {
      setShowCustom(true);
      setCustomCat("");
    } else {
      setShowCustom(false);
      setCustomCat("");
    }
  };

  const finalCategory = () => {
    if (category === "Others") return customCat.trim() || "Others";
    return category;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to add transactions.");
      return;
    }

    const cat = finalCategory();
    if (!title || !amount || !cat) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (showCustom && !customCat.trim()) {
      toast.error("Please enter a custom category name.");
      return;
    }

    const sign = TX_TYPES.find((t) => t.id === txType).sign;
    const signedAmount = sign * Math.abs(Number(amount));

    try {
      if (editData) {
        await updateDoc(doc(db, "transactions", editData.firestoreId), {
          title,
          amount: signedAmount,
          category: cat,
        });
        setTransactions(transactions.map((t) =>
          t.firestoreId === editData.firestoreId
            ? { ...editData, title, amount: signedAmount, category: cat }
            : t
        ));
        toast.success("Transaction updated.");
        setEditData(null);
      } else {
        const newTx = {
          id: Date.now(),
          title,
          amount: signedAmount,
          category: cat,
          type: txType,
          userId: currentUser.uid,   // ← use currentUser, not auth.currentUser
          date: new Date().toLocaleDateString("en-IN"),
        };
        const ref = await addDoc(collection(db, "transactions"), newTx);
        setTransactions([{ firestoreId: ref.id, ...newTx }, ...transactions]);
        toast.success("Transaction added.");
      }
      resetForm();
    } catch (err) {
      console.error("Firestore write error:", err);
      toast.error("Failed to save transaction: " + err.message);
    }
  };

  const isEditing   = Boolean(editData);
  const activeType  = TX_TYPES.find((t) => t.id === txType);

  return (
    <div className="panel atx-panel">
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isEditing ? <Pencil size={15} /> : <Plus size={15} />}
            {isEditing ? "Edit Transaction" : "New Transaction"}
          </div>
          <div className="panel-subtitle">
            {isEditing
              ? "Update the details below, then save."
              : "Record a credit or debit to your account."}
          </div>
        </div>
        {isEditing && (
          <button
            className="pill-btn"
            onClick={() => { setEditData(null); resetForm(); }}
            style={{ fontSize: 12 }}
          >
            <X size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Cancel
          </button>
        )}
      </div>

      {/* Type toggle */}
      <div className="tx-type-tabs">
        {TX_TYPES.map(({ id, label, color }) => (
          <button
            key={id}
            type="button"
            className={`tx-type-tab ${txType === id ? "active" : ""}`}
            style={txType === id ? { borderColor: color, color } : {}}
            onClick={() => setTxType(id)}
          >
            <span
              className="tx-type-dot"
              style={{ background: txType === id ? color : "var(--text-muted)" }}
            />
            {label}
          </button>
        ))}
        <span className="tx-type-hint">{activeType.hint}</span>
      </div>

      <form className="tx-form" onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-field">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            placeholder={txType === "credit" ? "e.g. Monthly salary" : "e.g. Grocery run"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="form-field">
          <label className="form-label">Amount (₹)</label>
          <div className="amount-input-wrap">
            <span className="amount-sign" style={{ color: activeType.color }}>
              {txType === "credit" ? "+" : "−"}
            </span>
            <input
              type="number"
              className="form-input amount-input"
              placeholder="0"
              value={amount}
              min="0"
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Category */}
        <div className={`form-field ${showCustom ? "form-field-wide" : ""}`}>
          <label className="form-label">Category</label>
          <div className="cat-select-row">
            <select
              className="form-select"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {showCustom && (
              <div className="custom-cat-wrap">
                <Tag size={14} className="custom-cat-icon" />
                <input
                  ref={customRef}
                  type="text"
                  className="form-input custom-cat-input"
                  placeholder="Type category name…"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  maxLength={32}
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="form-field form-field-submit">
          <button
            type="submit"
            className={`submit-btn ${isEditing ? "editing" : ""} ${txType === "credit" ? "credit" : "debit"}`}
          >
            {isEditing
              ? "Save changes"
              : txType === "credit" ? "Add credit →" : "Add debit →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTransaction;
