import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, query,
  where, updateDoc, deleteDoc, doc
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { toast } from "react-toastify";
import {
  Plus, Trash2, PlusCircle, Target, Trophy,
  Calendar, TrendingUp, X, Check
} from "lucide-react";

const fmt  = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
const EMOJIS = ["🏍️","✈️","🏠","🚗","💻","📱","🎓","💍","🏖️","🏋️","🎸","📷","⌚","🛒","🌍","💰","🎯","🏡","🚀","🎉"];

/* ── Days remaining helper ── */
function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── Monthly needed helper ── */
function monthsLeft(deadline) {
  if (!deadline) return null;
  const now  = new Date();
  const end  = new Date(deadline);
  return Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
}

/* ══════════════════
   CREATE GOAL MODAL
══════════════════ */
function CreateGoalModal({ onClose, onSave }) {
  const [name,     setName]     = useState("");
  const [emoji,    setEmoji]    = useState("🎯");
  const [target,   setTarget]   = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving,   setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (!name.trim())        { toast.error("Enter a goal name.");    return; }
    if (!target || target <= 0) { toast.error("Enter a valid target amount."); return; }
    setSaving(true);
    await onSave({ name: name.trim(), emoji, target: Number(target), deadline, saved: 0, contributions: [] });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>New Goal</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {/* Emoji picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Pick an emoji</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 38, height: 38, borderRadius: 10, fontSize: 18, cursor: "pointer",
                  border: emoji === e ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: emoji === e ? "var(--accent-dim)" : "var(--bg-elevated)",
                  transition: "all 0.15s",
                }}
              >{e}</button>
            ))}
          </div>
        </div>

        {/* Goal name */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Goal name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Royal Enfield, Trip to Maldives"
            style={inputStyle}
          />
        </div>

        {/* Target amount */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Target amount (₹)</label>
          <input
            type="number"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="e.g. 180000"
            style={inputStyle}
          />
        </div>

        {/* Deadline */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Deadline <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#080c10", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Check size={15} /> Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════
   ADD CONTRIBUTION MODAL
══════════════════════ */
function ContributeModal({ goal, onClose, onSave }) {
  const [amount,  setAmount]  = useState("");
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);

  const remaining = goal.target - goal.saved;

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { toast.error("Enter a valid amount."); return; }
    if (val > remaining)        { toast.error(`Max you can add is ${fmt(remaining)}.`); return; }
    setSaving(true);
    await onSave(goal, val, note.trim());
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 380, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
            {goal.emoji} Add Money
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ background: "var(--bg-base)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Remaining to reach goal</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{fmt(remaining)}</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Amount to add (₹)</label>
          <input
            autoFocus
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. 5000"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Note <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Saved from this month's salary"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--income)", border: "none", color: "#080c10", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <PlusCircle size={15} /> Add Money
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════
   GOAL CARD
══════════════════ */
function GoalCard({ goal, onContribute, onDelete }) {
  const pct       = Math.min((goal.saved / goal.target) * 100, 100);
  const done      = pct >= 100;
  const days      = daysLeft(goal.deadline);
  const months    = monthsLeft(goal.deadline);
  const remaining = goal.target - goal.saved;
  const perMonth  = months ? Math.ceil(remaining / months) : null;

  const barColor  = done ? "var(--income)" : pct > 66 ? "var(--accent)" : pct > 33 ? "var(--warning)" : "var(--balance)";

  return (
    <div className={`goal-card ${
        done        ? "completed"     :
        pct > 66    ? "progress-high" :
        pct > 33    ? "progress-mid"  :
                        "progress-low"
        }`}>
      {/* Completed glow */}
      {done && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,229,195,0.03)", pointerEvents: "none", borderRadius: 16 }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: done ? "var(--accent-dim)" : "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${done ? "rgba(0,229,195,0.2)" : "var(--border)"}` }}>
            {done ? "🎉" : goal.emoji}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{goal.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {done ? "Goal achieved!" : `${fmt(goal.saved)} saved of ${fmt(goal.target)}`}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(goal)}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--expense)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 10, background: barColor,
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 10px ${barColor}50`,
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct.toFixed(1)}% complete</span>
        {!done && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(remaining)} to go</span>}
        {done  && <span style={{ fontSize: 12, color: "var(--income)", fontWeight: 700 }}>✅ Completed!</span>}
      </div>

      {/* Info chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: done ? 0 : 16 }}>
        <div style={chip}>
          <Target size={11} />
          Target: {fmt(goal.target)}
        </div>
        {goal.deadline && (
          <div style={{ ...chip, color: days !== null && days < 30 ? "var(--expense)" : "var(--text-muted)" }}>
            <Calendar size={11} />
            {days !== null && days > 0 ? `${days} days left` : days === 0 ? "Due today!" : "Deadline passed"}
          </div>
        )}
        {perMonth && !done && (
          <div style={chip}>
            <TrendingUp size={11} />
            Save {fmt(perMonth)}/month
          </div>
        )}
      </div>

      {/* Contribution history */}
      {goal.contributions?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Recent contributions
          </div>
          {[...goal.contributions].reverse().slice(0, 3).map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.note || "Contribution"} · <span style={{ color: "var(--text-muted)" }}>{c.date}</span></span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--income)", fontWeight: 600 }}>+{fmt(c.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add money button */}
      {!done && (
        <button
          onClick={() => onContribute(goal)}
          style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: "var(--accent-dim)", border: "1px solid rgba(0,229,195,0.2)",
            color: "var(--accent)", fontWeight: 700, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, transition: "all 0.2s",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#080c10"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; }}
        >
          <Plus size={14} /> Add Money
        </button>
      )}
    </div>
  );
}

/* ══════════════════
   MAIN PAGE
══════════════════ */
function GoalsPage() {
  const [goals,       setGoals]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [contributeTarget, setContributeTarget] = useState(null);

  const uid = auth.currentUser.uid;

  // Load goals
  useEffect(() => {
    const load = async () => {
      const q    = query(collection(db, "goals"), where("userId", "==", uid));
      const snap = await getDocs(q);
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  // Create goal
  const handleCreate = async (data) => {
    try {
      const ref = await addDoc(collection(db, "goals"), { ...data, userId: uid, createdAt: Date.now() });
      setGoals(prev => [...prev, { id: ref.id, ...data, userId: uid }]);
      setShowCreate(false);
      toast.success("Goal created! 🎯");
    } catch {
      toast.error("Failed to create goal.");
    }
  };

  // Add contribution
  const handleContribute = async (goal, amount, note) => {
    const newSaved         = goal.saved + amount;
    const newContribution  = { amount, note, date: new Date().toLocaleDateString("en-IN") };
    const newContributions = [...(goal.contributions || []), newContribution];
    const completed        = newSaved >= goal.target;

    try {
      await updateDoc(doc(db, "goals", goal.id), { saved: newSaved, contributions: newContributions });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, saved: newSaved, contributions: newContributions } : g));
      setContributeTarget(null);
      if (completed) toast.success(`🎉 You've reached your "${goal.name}" goal!`);
      else toast.success(`₹${amount.toLocaleString("en-IN")} added to "${goal.name}"!`);
    } catch {
      toast.error("Failed to save contribution.");
    }
  };

  // Delete goal
  const handleDelete = async (goal) => {
    if (!window.confirm(`Delete "${goal.name}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "goals", goal.id));
      setGoals(prev => prev.filter(g => g.id !== goal.id));
      toast.success("Goal deleted.");
    } catch {
      toast.error("Failed to delete goal.");
    }
  };

  const totalSaved  = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const completed   = goals.filter(g => g.saved >= g.target).length;
  const active      = goals.filter(g => g.saved < g.target).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Goals</h1>
          <p>Set savings goals and track your progress towards them.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "var(--accent)", border: "none", borderRadius: 10, color: "#080c10", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-display)", transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <Plus size={15} /> New Goal
        </button>
      </div>

      {/* Summary strip */}
      {goals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Saved",   value: fmt(totalSaved),   color: "var(--income)"  },
            { label: "Total Target",  value: fmt(totalTarget),  color: "var(--balance)" },
            { label: "Active Goals",  value: active,            color: "var(--warning)" },
            { label: "Completed",     value: completed,         color: "var(--accent)"  },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>No goals yet</h2>
          <p style={{ fontSize: 14, marginBottom: 24 }}>Create your first goal — a bike, a trip, anything you're saving towards.</p>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "var(--accent)", border: "none", borderRadius: 10, color: "#080c10", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-display)" }}
          >
            <Plus size={15} /> Create First Goal
          </button>
        </div>
      )}

      {/* Goals grid */}
      {goals.length > 0 && (
        <>
          {/* Active goals */}
          {active > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <TrendingUp size={14} color="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active — {active}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
                {goals.filter(g => g.saved < g.target).map(goal => (
                  <GoalCard key={goal.id} goal={goal} onContribute={setContributeTarget} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}

          {/* Completed goals */}
          {completed > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Trophy size={14} color="var(--income)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Completed — {completed}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {goals.filter(g => g.saved >= g.target).map(goal => (
                  <GoalCard key={goal.id} goal={goal} onContribute={setContributeTarget} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Modals */}
      {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {contributeTarget && <ContributeModal goal={contributeTarget} onClose={() => setContributeTarget(null)} onSave={handleContribute} />}
    </div>
  );
}

const labelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
  textTransform: "uppercase", color: "var(--text-muted)",
  display: "block", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-base)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)",
  fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
};

const chip = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  color: "var(--text-muted)",
};

export default GoalsPage;