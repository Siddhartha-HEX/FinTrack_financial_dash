import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { Pencil, Check, X, Target } from "lucide-react";
import { toast } from "react-toastify";

const CATEGORIES = [
  "Food", "Shopping", "Bills", "Transport",
  "Healthcare", "Entertainment", "Freelance",
  "Investment", "Gift", "Refund", "Salary",
];

const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

function BudgetBar({ category, budget, spent, onEdit }) {
  const pct     = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over    = spent > budget && budget > 0;
  const barColor = over ? "var(--expense)" : pct > 75 ? "var(--warning)" : "var(--income)";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: hovered ? "var(--bg-elevated)" : "transparent",
        border: "1px solid " + (over ? "rgba(255,77,109,0.2)" : "var(--border)"),
        transition: "all 0.2s",
        marginBottom: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{category}</span>
          {over && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--expense)", background: "var(--expense-dim)", padding: "2px 8px", borderRadius: 20 }}>
              OVER BUDGET
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: over ? "var(--expense)" : "var(--text-primary)" }}>
            {fmt(spent)} / {budget > 0 ? fmt(budget) : <span style={{ color: "var(--text-muted)" }}>not set</span>}
          </span>
          <button
            onClick={() => onEdit(category)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", display: "flex", alignItems: "center",
              padding: 4, borderRadius: 6, transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      {/* Progress track */}
      <div style={{ height: 7, background: "var(--bg-hover)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: barColor,
          borderRadius: 10,
          transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 8px ${barColor}60`,
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {budget > 0 ? `${pct.toFixed(0)}% used` : "Set a budget to track"}
        </span>
        {budget > 0 && !over && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {fmt(budget - spent)} remaining
          </span>
        )}
        {over && (
          <span style={{ fontSize: 11, color: "var(--expense)", fontWeight: 600 }}>
            {fmt(spent - budget)} over
          </span>
        )}
      </div>
    </div>
  );
}

function BudgetTracker({ transactions }) {
  const [budgets, setBudgets]       = useState({});
  const [editCat, setEditCat]       = useState(null);
  const [editValue, setEditValue]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  // Which month to show
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthKey   = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = targetDate.toLocaleString("en-IN", { month: "long", year: "numeric" });

  // Load budgets from Firebase
  useEffect(() => {
    const load = async () => {
      const ref  = doc(db, "budgets", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setBudgets(snap.data());
    };
    load();
  }, []);

  // Save budgets to Firebase
  const saveBudgets = async (updated) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "budgets", auth.currentUser.uid), updated);
      setBudgets(updated);
      toast.success("Budget saved!");
    } catch {
      toast.error("Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = () => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { toast.error("Enter a valid amount."); return; }
    saveBudgets({ ...budgets, [editCat]: val });
    setEditCat(null);
    setEditValue("");
  };

  // Spending this month per category
  const spentByCategory = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.amount >= 0) return;
      const parts = t.date.split("/");
      const d = parts.length === 3
        ? new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`)
        : new Date(t.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key !== monthKey) return;
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [transactions, monthKey]);

  // Summary numbers
  const totalBudgeted = CATEGORIES.reduce((s, c) => s + (budgets[c] || 0), 0);
  const totalSpent    = CATEGORIES.reduce((s, c) => s + (spentByCategory[c] || 0), 0);
  const overCount     = CATEGORIES.filter(c => budgets[c] > 0 && (spentByCategory[c] || 0) > budgets[c]).length;

  // Sort: over budget first, then by % used desc
  const sorted = [...CATEGORIES].sort((a, b) => {
    const aOver = budgets[a] > 0 && (spentByCategory[a] || 0) > budgets[a];
    const bOver = budgets[b] > 0 && (spentByCategory[b] || 0) > budgets[b];
    if (aOver !== bOver) return bOver - aOver;
    const aPct = budgets[a] > 0 ? (spentByCategory[a] || 0) / budgets[a] : 0;
    const bPct = budgets[b] > 0 ? (spentByCategory[b] || 0) / budgets[b] : 0;
    return bPct - aPct;
  });

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={16} color="var(--accent)" />
            Budget vs Actual
          </div>
          <div className="panel-subtitle">Track your spending against monthly budgets</div>
        </div>

        {/* Month navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setMonthOffset(o => o - 1)}
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", cursor: "pointer", padding: "6px 10px", fontSize: 14 }}
          >‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", minWidth: 130, textAlign: "center" }}>{monthLabel}</span>
          <button
            onClick={() => setMonthOffset(o => Math.min(o + 1, 0))}
            disabled={monthOffset === 0}
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: monthOffset === 0 ? "var(--text-muted)" : "var(--text-secondary)", cursor: monthOffset === 0 ? "not-allowed" : "pointer", padding: "6px 10px", fontSize: 14, opacity: monthOffset === 0 ? 0.4 : 1 }}
          >›</button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Budgeted", value: fmt(totalBudgeted), color: "var(--balance)" },
          { label: "Total Spent",    value: fmt(totalSpent),    color: totalSpent > totalBudgeted ? "var(--expense)" : "var(--income)" },
          { label: "Remaining",      value: fmt(Math.max(totalBudgeted - totalSpent, 0)), color: "var(--income)" },
          { label: "Over Budget",    value: `${overCount} categor${overCount === 1 ? "y" : "ies"}`, color: overCount > 0 ? "var(--expense)" : "var(--text-muted)" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 120, background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Inline edit box */}
      {editCat && (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
            Set budget for <span style={{ color: "var(--accent)" }}>{editCat}</span>
          </span>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 14 }}>₹</span>
            <input
              autoFocus
              type="number"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") { setEditCat(null); setEditValue(""); } }}
              placeholder="e.g. 3000"
              style={{ padding: "8px 12px 8px 26px", background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 14, outline: "none", width: 160 }}
            />
          </div>
          <button onClick={handleSaveEdit} disabled={saving} style={{ background: "var(--income)", border: "none", borderRadius: 8, color: "#080c10", padding: "8px 14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Check size={14} /> Save
          </button>
          <button onClick={() => { setEditCat(null); setEditValue(""); }} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Budget bars */}
      {sorted.map(cat => (
        <BudgetBar
          key={cat}
          category={cat}
          budget={budgets[cat] || 0}
          spent={spentByCategory[cat] || 0}
          onEdit={(c) => { setEditCat(c); setEditValue(budgets[c] ? String(budgets[c]) : ""); }}
        />
      ))}
    </div>
  );
}

export default BudgetTracker;