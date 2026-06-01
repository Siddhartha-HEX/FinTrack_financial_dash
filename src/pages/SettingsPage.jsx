import { useState , useEffect } from "react";
import {
  User, Moon, Sun, DollarSign, Shield,
  LogOut, Trash2, AlertTriangle, Check, Eye, EyeOff, ChevronDown,
  X, Pencil
} from "lucide-react";
import {
  updatePassword, deleteUser,
  reauthenticateWithCredential, EmailAuthProvider
} from "firebase/auth";
import { deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { toast } from "react-toastify";
import { updateProfile } from "firebase/auth";

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
];

const DEFAULT_PAGES = ["Dashboard", "Transactions", "Analytics", "Budget", "Goals"];

/* ── Section wrapper ── */
function Section({ icon: Icon, title, subtitle, children, danger }) {
  return (
    <div className="panel" style={{ borderColor: danger ? "rgba(255,77,109,0.2)" : "var(--border)" }}>
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: danger ? "var(--expense-dim)" : "var(--accent-dim)",
            color: danger ? "var(--expense)" : "var(--accent)",
          }}>
            <Icon size={17} />
          </div>
          <div>
            <div className="panel-title">{title}</div>
            {subtitle && <div className="panel-subtitle">{subtitle}</div>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsPage({ darkMode, setDarkMode }) {
  const user = auth.currentUser;

  const AVATAR_COLORS = ["#00e5c3", "#7c9cff", "#ff4d6d", "#f5a623", "#a78bfa", "#f472b6"];

  const [displayName,  setDisplayName]  = useState(user?.displayName || "FinTrack User");
  const [nameInput,    setNameInput]    = useState("");
  const [editingName,  setEditingName]  = useState(false);
  const [nameSaving,   setNameSaving]   = useState(false);
  const [avatarColor,  setAvatarColor]  = useState(() => localStorage.getItem("avatarColor") || "#00e5c3");
  const [accountStats, setAccountStats] = useState({ transactions: 0, goals: 0, goalsCompleted: 0 });

  // Currency
  const [currency,    setCurrency]    = useState(() => localStorage.getItem("currency") || "INR");

  // Default page
  const [defaultPage, setDefaultPage] = useState(() => localStorage.getItem("defaultPage") || "Dashboard");

  // Change password
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [pwdLoading,  setPwdLoading]  = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePwd,     setDeletePwd]     = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Avatar initials
  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || "U";

  /* ── Save currency ── */
  const handleCurrencySave = (val) => {
    setCurrency(val);
    localStorage.setItem("currency", val);
    toast.success("Currency updated!");
  };

  /* ── Save default page ── */
  const handleDefaultPageSave = (val) => {
    setDefaultPage(val);
    localStorage.setItem("defaultPage", val);
    toast.success("Default page updated!");
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error("Fill all fields."); return; }
    if (newPwd !== confirmPwd)                  { toast.error("New passwords don't match."); return; }
    if (newPwd.length < 6)                      { toast.error("Password must be at least 6 characters."); return; }

    setPwdLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPwd);
      toast.success("Password updated successfully!");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e) {
      if (e.code === "auth/wrong-password") toast.error("Current password is incorrect.");
      else toast.error("Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    await auth.signOut();
    toast.success("Logged out!");
  };

  /* ── Delete account ── */
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { toast.error('Type DELETE to confirm.'); return; }
    if (!deletePwd)                 { toast.error("Enter your password."); return; }

    setDeleteLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePwd);
      await reauthenticateWithCredential(user, credential);

      // Delete all transactions
      const q    = query(collection(db, "transactions"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

      // Delete user
      await deleteUser(user);
      toast.success("Account deleted.");
    } catch (e) {
      if (e.code === "auth/wrong-password") toast.error("Password is incorrect.");
      else toast.error("Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Load account stats
    useEffect(() => {
    const load = async () => {
        const txQ    = query(collection(db, "transactions"), where("userId", "==", user.uid));
        const txSnap = await getDocs(txQ);

        const goalsQ    = query(collection(db, "goals"), where("userId", "==", user.uid));
        const goalsSnap = await getDocs(goalsQ);
        const goalsData = goalsSnap.docs.map(d => d.data());

        setAccountStats({
        transactions:    txSnap.size,
        goals:           goalsData.length,
        goalsCompleted:  goalsData.filter(g => g.saved >= g.target).length,
        });
    };
    load();
    }, []);

    // Save name
    const handleSaveName = async () => {
    if (!nameInput.trim()) { toast.error("Name cannot be empty."); return; }
    setNameSaving(true);
    try {
        await updateProfile(user, { displayName: nameInput.trim() });
        setDisplayName(nameInput.trim());
        setEditingName(false);
        toast.success("Name updated!");
    } catch {
        toast.error("Failed to update name.");
    } finally {
        setNameSaving(false);
    }
    };

    // Save avatar color
    const handleAvatarColor = (color) => {
    setAvatarColor(color);
    localStorage.setItem("avatarColor", color);
    toast.success("Avatar color updated!");
    };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* Page header */}
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile, preferences, and account.</p>
      </div>

      {/* ── Profile ── */}
        <Section icon={User} title="Profile" subtitle="Your account information">
        
        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: avatarColor + "22",
            border: `2px solid ${avatarColor}66`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800,
            color: avatarColor, transition: "all 0.3s",
            }}>
            {initials}
            </div>
            <div style={{ flex: 1 }}>
            {editingName ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    style={{ ...inputStyle, fontSize: 16, fontWeight: 700, flex: 1 }}
                    placeholder="Your name"
                />
                <button onClick={handleSaveName} disabled={nameSaving} style={{ background: "var(--income)", border: "none", borderRadius: 8, color: "#080c10", padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={13} /> {nameSaving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditingName(false)} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", padding: "8px 10px", cursor: "pointer" }}>
                    <X size={13} />
                </button>
                </div>
            ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    {displayName}
                </span>
                <button
                    onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >
                    <Pencil size={14} />
                </button>
                </div>
            )}
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Member since {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                : "—"}
            </div>
            </div>
        </div>

        {/* Avatar color picker */}
        <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Avatar Color</label>
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {AVATAR_COLORS.map(color => (
                <button
                key={color}
                onClick={() => handleAvatarColor(color)}
                style={{
                    width: 32, height: 32, borderRadius: "50%", background: color,
                    border: avatarColor === color ? `3px solid white` : "3px solid transparent",
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: avatarColor === color ? `0 0 12px ${color}` : "none",
                }}
                />
            ))}
            </div>
        </div>

        {/* Account stats */}
        <div>
            <label style={labelStyle}>Account Stats</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 6 }}>
            {[
                { label: "Transactions",  value: accountStats.transactions,  color: "var(--balance)" },
                { label: "Goals Created", value: accountStats.goals,         color: "var(--accent)"  },
                { label: "Goals Done",    value: accountStats.goalsCompleted,color: "var(--income)"  },
                { label: "Last Login",    value: user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-IN")
                    : "—",                                                    color: "var(--warning)" },
            ].map(s => (
                <div key={s.label} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
            ))}
            </div>
        </div>

        </Section>

      {/* ── Appearance ── */}
      <Section icon={darkMode ? Moon : Sun} title="Appearance" subtitle="Choose your preferred theme">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
              {darkMode ? "Dark Mode" : "Light Mode"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {darkMode ? "Easy on the eyes at night" : "Clean and bright interface"}
            </div>
          </div>
          {/* Toggle switch */}
          <div
            onClick={() => setDarkMode(d => !d)}
            style={{
              width: 52, height: 28, borderRadius: 20, cursor: "pointer",
              background: darkMode ? "var(--accent)" : "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              position: "relative", transition: "background 0.3s",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3,
              left: darkMode ? 26 : 3,
              width: 20, height: 20, borderRadius: "50%",
              background: darkMode ? "#080c10" : "var(--text-muted)",
              transition: "left 0.3s var(--ease)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {darkMode ? <Moon size={11} color="var(--accent)" /> : <Sun size={11} color="white" />}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Preferences ── */}
      <Section icon={DollarSign} title="Preferences" subtitle="Currency and default page">

        {/* Currency */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Currency</label>
          <div style={{ position: "relative" }}>
            <select
              value={currency}
              onChange={e => handleCurrencySave(e.target.value)}
              style={{ ...selectStyle, paddingRight: 36 }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Default page */}
        <div>
          <label style={labelStyle}>Default page on login</label>
          <div style={{ position: "relative" }}>
            <select
              value={defaultPage}
              onChange={e => handleDefaultPageSave(e.target.value)}
              style={{ ...selectStyle, paddingRight: 36 }}
            >
              {DEFAULT_PAGES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          </div>
        </div>
      </Section>

      {/* ── Security ── */}
      <Section icon={Shield} title="Security" subtitle="Change your password">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Current password", val: currentPwd, set: setCurrentPwd },
            { label: "New password",     val: newPwd,     set: setNewPwd     },
            { label: "Confirm password", val: confirmPwd, set: setConfirmPwd },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label style={labelStyle}>{label}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
                <button
                  onClick={() => setShowPwd(s => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleChangePassword}
            disabled={pwdLoading}
            style={primaryBtn}
          >
            <Check size={14} />
            {pwdLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </Section>

      {/* ── Logout ── */}
      <Section icon={LogOut} title="Session" subtitle="Sign out of your account">
        <button
          onClick={handleLogout}
          style={{ ...primaryBtn, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </Section>

      {/* ── Danger Zone ── */}
      <Section icon={AlertTriangle} title="Danger Zone" subtitle="Irreversible actions — proceed with caution" danger>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--expense-dim)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--expense)" }}>
            ⚠️ Deleting your account will permanently remove all your transactions, budgets, and goals. This cannot be undone.
          </div>
          <div>
            <label style={labelStyle}>Type DELETE to confirm</label>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              style={{ ...inputStyle, borderColor: deleteConfirm === "DELETE" ? "var(--expense)" : "var(--border)" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Your password</label>
            <input
              type="password"
              value={deletePwd}
              onChange={e => setDeletePwd(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading || deleteConfirm !== "DELETE"}
            style={{
              ...primaryBtn,
              background: deleteConfirm === "DELETE" ? "var(--expense)" : "var(--bg-elevated)",
              color: deleteConfirm === "DELETE" ? "white" : "var(--text-muted)",
              opacity: deleteLoading ? 0.6 : 1,
              cursor: deleteConfirm !== "DELETE" ? "not-allowed" : "pointer",
            }}
          >
            <Trash2 size={14} />
            {deleteLoading ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </Section>

    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  letterSpacing: "0.07em", textTransform: "uppercase",
  color: "var(--text-muted)", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)",
  fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
};

const selectStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)",
  fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
  cursor: "pointer", appearance: "none",
};

const primaryBtn = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "11px",
  background: "var(--accent)", border: "none",
  borderRadius: 10, color: "#080c10",
  fontWeight: 700, fontSize: 14, cursor: "pointer",
  fontFamily: "var(--font-display)", transition: "opacity 0.2s",
};

export default SettingsPage;