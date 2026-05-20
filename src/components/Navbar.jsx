import { Search, Sun, Moon, LogOut, Trash2 } from "lucide-react";
import { signOut, deleteUser } from "firebase/auth";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { toast } from "react-toastify";

function Navbar({ searchTerm, setSearchTerm, filterCategory, setFilterCategory, darkMode, setDarkMode }) {

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Signed out.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account and all transactions? This cannot be undone.")) return;
    const user = auth.currentUser;
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "transactions", d.id))));
      await deleteUser(user);
      toast.success("Account deleted.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const email = auth.currentUser?.email || "";
  const initials = email ? email[0].toUpperCase() : "U";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search-wrap">
          <Search />
          <input
            type="text"
            placeholder="Search transactions…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All categories</option>
          <option value="Food">Food</option>
          <option value="Shopping">Shopping</option>
          <option value="Salary">Salary</option>
          <option value="Bills">Bills</option>
        </select>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="pill-btn" onClick={handleLogout} title="Sign out">
          <LogOut size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Sign out
        </button>

        <button className="pill-btn danger" onClick={handleDeleteAccount} title="Delete account">
          <Trash2 size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Delete
        </button>

        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
