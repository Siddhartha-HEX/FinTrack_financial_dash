import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

function Transactions({ transactions, setTransactions, setEditData }) {

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});

  const deleteTransaction = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "transactions", firestoreId));
      setTransactions(transactions.filter((item) => item.firestoreId !== firestoreId));
    } catch (error) {
      console.log(error);
    }
  };

  const startInlineEdit = (item) => {
    setInlineEditId(item.firestoreId || item.id);
    setInlineEditData({
      title: item.title,
      category: item.category,
      amount: item.amount,
      date: item.date,
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineEditData({});
  };

  const saveInlineEdit = async (firestoreId) => {
    try {
      await updateDoc(doc(db, "transactions", firestoreId), {
        title: inlineEditData.title,
        category: inlineEditData.category,
        amount: Number(inlineEditData.amount),
        date: inlineEditData.date,
      });
      setTransactions(transactions.map((item) =>
        item.firestoreId === firestoreId
          ? { ...item, ...inlineEditData, amount: Number(inlineEditData.amount) }
          : item
      ));
      cancelInlineEdit();
    } catch (error) {
      console.log(error);
    }
  };

  const applyQuickFilter = (value) => {
    setQuickFilter((prev) => (prev === value ? "" : value));
    setStartDate("");
    setEndDate("");
  };

  const getFilteredByDate = () => {
    const now = new Date();
    let start = null;
    let end = null;

    if (quickFilter === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (quickFilter === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (quickFilter === "last_7") {
      start = new Date();
      start.setDate(now.getDate() - 7);
      end = now;
    } else if (quickFilter === "this_year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    if (!start || !end) return transactions;

    return transactions.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  };

  const filtered = getFilteredByDate();
  const totalAmount = filtered.reduce((acc, item) => acc + Number(item.amount), 0);
  const hasActiveFilter = quickFilter || startDate || endDate;

  return (
    <div className="transactions">

      <h2>Recent Transactions</h2>

      {/* Quick filter buttons */}
      <div className="date-filter-bar">
        <div className="quick-filters">
          {[
            { label: "This month", value: "this_month" },
            { label: "Last month", value: "last_month" },
            { label: "Last 7 days", value: "last_7" },
            { label: "This year", value: "this_year" },
          ].map((f) => (
            <button
              key={f.value}
              className={`quick-filter-btn ${quickFilter === f.value ? "active" : ""}`}
              onClick={() => applyQuickFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="custom-range">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setQuickFilter(""); }}
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setQuickFilter(""); }}
          />
          {hasActiveFilter && (
            <button
              className="clear-filter-btn"
              onClick={() => { setStartDate(""); setEndDate(""); setQuickFilter(""); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                No transactions found for this period.
              </td>
            </tr>
          ) : (
            filtered.map((item) => {
              const rowId = item.firestoreId || item.id;
              const isEditing = inlineEditId === rowId;

              return isEditing ? (
                <tr key={rowId} className="inline-edit-row">
                  <td>
                    <input
                      className="inline-input"
                      value={inlineEditData.title}
                      onChange={(e) => setInlineEditData({ ...inlineEditData, title: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      value={inlineEditData.category}
                      onChange={(e) => setInlineEditData({ ...inlineEditData, category: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      type="number"
                      value={inlineEditData.amount}
                      onChange={(e) => setInlineEditData({ ...inlineEditData, amount: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      type="date"
                      value={inlineEditData.date}
                      onChange={(e) => setInlineEditData({ ...inlineEditData, date: e.target.value })}
                    />
                  </td>
                  <td>
                    <button className="save-btn" onClick={() => saveInlineEdit(item.firestoreId)}>Save</button>
                    <button className="cancel-btn" onClick={cancelInlineEdit}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={rowId}>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td style={{ color: item.amount > 0 ? "lime" : "red", fontWeight: "bold" }}>
                    ₹{item.amount}
                  </td>
                  <td>{item.date}</td>
                  <td>
                    <button className="edit-btn" onClick={() => startInlineEdit(item)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteTransaction(item.firestoreId)}>Delete</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

        {filtered.length > 0 && (
          <tfoot>
            <tr className="table-footer">
              <td colSpan="2"><strong>Total ({filtered.length} transactions)</strong></td>
              <td style={{ color: totalAmount >= 0 ? "lime" : "red", fontWeight: "bold" }}>
                ₹{totalAmount}
              </td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        )}
      </table>

    </div>
  );
}

export default Transactions;