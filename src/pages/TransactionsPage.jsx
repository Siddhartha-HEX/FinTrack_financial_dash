import { useState, useMemo } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { toast } from "react-toastify";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Download, Trash2, Pencil, Receipt, X, AlertTriangle,
  ArrowUpCircle, ArrowDownCircle, Filter,
} from "lucide-react";
import AddTransaction from "../components/AddTransaction";

/* ── Category badge map ── */
const CAT_CLASS = {
  Food: "cat-food", Shopping: "cat-shopping", Salary: "cat-salary",
  Bills: "cat-bills", Transport: "cat-transport", Healthcare: "cat-healthcare",
  Entertainment: "cat-entertainment", Freelance: "cat-freelance",
  Investment: "cat-investment", Gift: "cat-gift", Refund: "cat-refund",
};

const ALL_CATEGORIES = [
  "All", "Food", "Shopping", "Salary", "Bills",
  "Transport", "Healthcare", "Entertainment",
  "Freelance", "Investment", "Gift", "Refund",
];

const PAGE_SIZES = [10, 25, 50];

/* ══════════════════════
   CONFIRM DELETE MODAL
══════════════════════ */
function ConfirmModal({ item, onConfirm, onCancel }) {
  if (!item) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon"><AlertTriangle size={22} /></div>
        <h3 className="modal-title">Delete transaction?</h3>
        <p className="modal-body">
          <strong>{item.title}</strong> —{" "}
          <span className={item.amount > 0 ? "positive" : "negative"}>
            {item.amount > 0 ? "+" : ""}₹{Math.abs(item.amount).toLocaleString("en-IN")}
          </span>
          <br />
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════
   SORT ICON
══════════════════════ */
function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field)
    return <ChevronsUpDown size={13} style={{ opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ChevronUp   size={13} style={{ color: "var(--accent)" }} />
    : <ChevronDown size={13} style={{ color: "var(--accent)" }} />;
}

/* ══════════════════════
   CSV EXPORT
══════════════════════ */
function exportCSV(data) {
  const headers = ["Title", "Category", "Type", "Amount", "Date"];
  const rows = data.map((t) => [
    `"${t.title}"`,
    t.category,
    t.amount > 0 ? "Credit" : "Debit",
    Math.abs(t.amount),
    t.date,
  ]);
  const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `fintrack-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported!");
}

/* ══════════════════════════════
   MAIN COMPONENT
══════════════════════════════ */
function TransactionsPage({ transactions, setTransactions }) {
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [sortField, setSortField]       = useState("date");
  const [sortDir, setSortDir]           = useState("desc");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editData, setEditData]         = useState(null);
  const [showForm, setShowForm]         = useState(false);

  /* ── sort toggle ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  /* ── filter + sort ── */
  const processed = useMemo(() => {
    let data = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (catFilter !== "All") data = data.filter((t) => t.category === catFilter);
    if (typeFilter === "Credit") data = data.filter((t) => t.amount > 0);
    if (typeFilter === "Debit")  data = data.filter((t) => t.amount < 0);

    data.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "amount") { aVal = Math.abs(aVal); bVal = Math.abs(bVal); }
      if (sortField === "date")   { aVal = a.id; bVal = b.id; }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return data;
  }, [transactions, search, catFilter, typeFilter, sortField, sortDir]);

  /* ── pagination ── */
  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginated  = processed.slice((page - 1) * pageSize, page * pageSize);

  /* ── summary stats ── */
  const totalCredit = processed.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalDebit  = processed.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

  /* ── delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "transactions", deleteTarget.firestoreId));
      setTransactions((prev) =>
        prev.filter((t) => t.firestoreId !== deleteTarget.firestoreId)
      );
      toast.success("Transaction deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── edit ── */
  const handleEdit = (item) => {
    setEditData(item);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── page number pills ── */
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div>
      {/* ── Page header ── */}
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1>Transactions</h1>
          <p>View, search, sort and manage every transaction.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="pill-btn"
            onClick={() => {
              setEditData(null);
              setShowForm((v) => !v);
            }}
            style={
              showForm
                ? { borderColor: "var(--accent)", color: "var(--accent)" }
                : {}
            }
          >
            {showForm ? (
              <>
                <X size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Close form
              </>
            ) : (
              "+ New transaction"
            )}
          </button>
          <button className="pill-btn" onClick={() => exportCSV(processed)}>
            <Download size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Add / Edit form (collapsible) ── */}
      {showForm && (
        <AddTransaction
          transactions={transactions}
          setTransactions={setTransactions}
          editData={editData}
          setEditData={(data) => {
            setEditData(data);
            if (!data) setShowForm(false);
          }}
        />
      )}

      {/* ── Summary mini-cards ── */}
      <div className="tx-summary-row">
        <div className="tx-summary-card">
          <ArrowUpCircle size={15} color="var(--income)" />
          <span className="tx-summary-label">Credits in view</span>
          <span className="tx-summary-val positive">{fmt(totalCredit)}</span>
        </div>
        <div className="tx-summary-card">
          <ArrowDownCircle size={15} color="var(--expense)" />
          <span className="tx-summary-label">Debits in view</span>
          <span className="tx-summary-val negative">{fmt(totalDebit)}</span>
        </div>
        <div className="tx-summary-card">
          <Receipt size={15} color="var(--text-muted)" />
          <span className="tx-summary-label">Records</span>
          <span className="tx-summary-val">{processed.length}</span>
        </div>
      </div>

      {/* ── Filter toolbar ── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="tx-filter-bar">
          {/* Search */}
          <div className="search-wrap" style={{ flex: 1, maxWidth: 340 }}>
            <Search />
            <input
              type="text"
              placeholder="Search title or category…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Type pills */}
          <div className="type-filter-pills">
            {["All", "Credit", "Debit"].map((t) => (
              <button
                key={t}
                className={`type-pill ${typeFilter === t ? "active" : ""} ${
                  t === "Credit" ? "credit" : t === "Debit" ? "debit" : ""
                }`}
                onClick={() => { setTypeFilter(t); setPage(1); }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Page size */}
          <select
            className="filter-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>Show {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {processed.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 24px" }}>
            <Receipt />
            <p>No transactions match your filters.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th
                      className="sortable-th"
                      onClick={() => handleSort("title")}
                    >
                      <span>
                        Title{" "}
                        <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th>Category</th>
                    <th>Type</th>
                    <th
                      className="sortable-th"
                      onClick={() => handleSort("amount")}
                    >
                      <span>
                        Amount{" "}
                        <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th
                      className="sortable-th"
                      onClick={() => handleSort("date")}
                    >
                      <span>
                        Date{" "}
                        <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => (
                    <tr key={item.firestoreId || item.id}>
                      <td className="tx-title">{item.title}</td>
                      <td>
                        <span
                          className={`tx-category ${
                            CAT_CLASS[item.category] || "cat-other"
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`type-badge ${
                            item.amount > 0 ? "type-credit" : "type-debit"
                          }`}
                        >
                          {item.amount > 0 ? "Credit" : "Debit"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tx-amount ${
                            item.amount > 0 ? "positive" : "negative"
                          }`}
                        >
                          {item.amount > 0 ? "+" : "−"}₹
                          {Math.abs(item.amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="tx-date">{item.date}</td>
                      <td>
                        <div className="tx-actions">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="action-btn del"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing{" "}
                {Math.min((page - 1) * pageSize + 1, processed.length)}–
                {Math.min(page * pageSize, processed.length)} of{" "}
                {processed.length}
              </span>
              <div className="pagination-btns">
                <button className="pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="pg-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>

                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="pg-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`pg-btn ${page === p ? "active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}

                <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      <ConfirmModal
        item={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default TransactionsPage;