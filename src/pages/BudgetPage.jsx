import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { Pencil, Check, X, Target, Shield, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { toast } from "react-toastify";

const CATEGORIES = [
  "Food", "Shopping", "Bills", "Transport",
  "Healthcare", "Entertainment", "Freelance",
  "Investment", "Gift", "Refund", "Salary",
];

const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

const parseDate = (str) => {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length === 3)
    return new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
  return new Date(str);
};

/* ── Health Score ── */
function HealthScore({ score }) {
  const color = score >= 75 ? "var(--income)" : score >= 50 ? "var(--warning)" : "var(--expense)";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Moderate" : "Needs Attention";
  const icon  = score >= 75 ? Award : score >= 50 ? Shield : AlertTriangle;
  const Icon  = icon;

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="panel" style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
      {/* Circular progress */}
      <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
        <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="65" cy="65" r="54" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
          <circle
            cx="65" cy="65" r="54" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color }}>{score}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>/ 100</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon size={18} color={color} />
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", color }}>
            {label}
          </span>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
          {score >= 75
            ? "You're managing your budget really well. Most categories are on track!"
            : score >= 50
            ? "Decent budget control, but a few categories need attention."
            : "Several categories are over or near their limits. Time to review your spending."}
        </p>
        {/* Score bar */}
        <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 10, overflow: "hidden", maxWidth: 320 }}>
          <div style={{
            height: "100%", width: `${score}%`, borderRadius: 10,
            background: `linear-gradient(90deg, var(--expense), var(--warning) 50%, var(--income))`,
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 320, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "var(--expense)", fontWeight: 600 }}>Poor</span>
          <span style={{ fontSize: 10, color: "var(--warning)", fontWeight: 600 }}>Moderate</span>
          <span style={{ fontSize: 10, color: "var(--income)", fontWeight: 600 }}>Excellent</span>
        </div>
      </div>
    </div>
  );
}

/* ── Budget Bar ── */
function BudgetBar({ category, budget, spent, onEdit }) {
  const pct      = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over     = spent > budget && budget > 0;
  const barColor = over ? "var(--expense)" : pct > 75 ? "var(--warning)" : "var(--income)";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        padding: "14px 16px", borderRadius: 12,
        background: hovered ? "var(--bg-elevated)" : "transparent",
        border: "1px solid " + (over ? "rgba(255,77,109,0.25)" : "var(--border)"),
        transition: "all 0.2s", marginBottom: 10,
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
          {!over && pct > 75 && pct < 100 && budget > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warning)", background: "var(--warning-dim)", padding: "2px 8px", borderRadius: 20 }}>
              ALMOST FULL
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: over ? "var(--expense)" : "var(--text-primary)" }}>
            {fmt(spent)} / {budget > 0 ? fmt(budget) : <span style={{ color: "var(--text-muted)" }}>not set</span>}
          </span>
          <button
            onClick={() => onEdit(category)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      <div style={{ height: 7, background: "var(--bg-hover)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: barColor, borderRadius: 10,
          transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 8px ${barColor}60`,
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {budget > 0 ? `${pct.toFixed(0)}% used` : "Set a budget to track"}
        </span>
        {budget > 0 && !over && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmt(budget - spent)} remaining</span>
        )}
        {over && (
          <span style={{ fontSize: 11, color: "var(--expense)", fontWeight: 600 }}>{fmt(spent - budget)} over</span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════
   MAIN PAGE
══════════════════════ */
function BudgetPage({ transactions }) {
  const [budgets, setBudgets]         = useState({});
  const [editCat, setEditCat]         = useState(null);
  const [editValue, setEditValue]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthKey   = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = targetDate.toLocaleString("en-IN", { month: "long", year: "numeric" });

  useEffect(() => {
    const load = async () => {
      const ref  = doc(db, "budgets", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setBudgets(snap.data());
    };
    load();
  }, []);

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

  const spentByCategory = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.amount >= 0) return;
      const d = parseDate(t.date);
      if (!d || isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key !== monthKey) return;
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [transactions, monthKey]);

  // Health score calculation
  const healthScore = useMemo(() => {
    const setCats = CATEGORIES.filter(c => budgets[c] > 0);
    if (setCats.length === 0) return 50;

    let score = 100;
    setCats.forEach(c => {
      const spent = spentByCategory[c] || 0;
      const pct   = spent / budgets[c];
      if (pct > 1)       score -= 20;  // over budget
      else if (pct > 0.9) score -= 10; // 90-100%
      else if (pct > 0.75) score -= 5; // 75-90%
    });

    // Bonus: more categories tracked = more awareness
    const trackingBonus = Math.min(setCats.length * 2, 10);
    score += trackingBonus;

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [budgets, spentByCategory]);

  const totalBudgeted = CATEGORIES.reduce((s, c) => s + (budgets[c] || 0), 0);
  const totalSpent    = CATEGORIES.reduce((s, c) => s + (spentByCategory[c] || 0), 0);
  const overCount     = CATEGORIES.filter(c => budgets[c] > 0 && (spentByCategory[c] || 0) > budgets[c]).length;
  const onTrackCount  = CATEGORIES.filter(c => budgets[c] > 0 && (spentByCategory[c] || 0) <= budgets[c]).length;

  const sorted = [...CATEGORIES].sort((a, b) => {
    const aOver = budgets[a] > 0 && (spentByCategory[a] || 0) > budgets[a];
    const bOver = budgets[b] > 0 && (spentByCategory[b] || 0) > budgets[b];
    if (aOver !== bOver) return bOver - aOver;
    const aPct = budgets[a] > 0 ? (spentByCategory[a] || 0) / budgets[a] : -1;
    const bPct = budgets[b] > 0 ? (spentByCategory[b] || 0) / budgets[b] : -1;
    return bPct - aPct;
  });

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Budget</h1>
          <p>Set monthly limits and track your spending per category.</p>
        </div>

        {/* Month navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setMonthOffset(o => o - 1)} style={navBtn}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", minWidth: 140, textAlign: "center" }}>{monthLabel}</span>
          <button
            onClick={() => setMonthOffset(o => Math.min(o + 1, 0))}
            disabled={monthOffset === 0}
            style={{ ...navBtn, opacity: monthOffset === 0 ? 0.3 : 1, cursor: monthOffset === 0 ? "not-allowed" : "pointer" }}
          >›</button>
        </div>
      </div>

      {/* Health score */}
      <HealthScore score={healthScore} />

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, margin: "20px 0" }}>
        {[
          { label: "Total Budgeted", value: fmt(totalBudgeted), color: "var(--balance)",       icon: Target },
          { label: "Total Spent",    value: fmt(totalSpent),    color: totalSpent > totalBudgeted ? "var(--expense)" : "var(--income)", icon: TrendingUp },
          { label: "Remaining",      value: fmt(Math.max(totalBudgeted - totalSpent, 0)), color: "var(--income)", icon: Shield },
          { label: "Over Budget",    value: `${overCount} categor${overCount === 1 ? "y" : "ies"}`, color: overCount > 0 ? "var(--expense)" : "var(--text-muted)", icon: AlertTriangle },
          { label: "On Track",       value: `${onTrackCount} categor${onTrackCount === 1 ? "y" : "ies"}`, color: "var(--income)", icon: Award },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Icon size={13} color={color} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Inline edit box */}
      {editCat && (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
            Set monthly budget for <span style={{ color: "var(--accent)" }}>{editCat}</span>
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
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={15} color="var(--accent)" /> Category Budgets
            </div>
            <div className="panel-subtitle">Click the pencil icon to set or update a budget</div>
          </div>
        </div>

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
    </div>
  );
}

const navBtn = {
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-secondary)", cursor: "pointer",
  padding: "6px 12px", fontSize: 15, transition: "all 0.15s",
};

export default BudgetPage;