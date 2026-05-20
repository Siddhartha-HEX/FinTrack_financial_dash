import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { toast } from "react-toastify";
import { Receipt } from "lucide-react";

const CAT_CLASS = {
  // Debit
  Transport:     "cat-transport",
  Healthcare:    "cat-healthcare",
  Entertainment: "cat-entertainment",
  // Credit
  Freelance:     "cat-freelance",
  Investment:    "cat-investment",
  Gift:          "cat-gift",
  Refund:        "cat-refund",
  Food:     "cat-food",
  Shopping: "cat-shopping",
  Salary:   "cat-salary",
  Bills:    "cat-bills",
};

function Transactions({ transactions, setTransactions, setEditData }) {

  const deleteTransaction = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "transactions", firestoreId));
      setTransactions((prev) => prev.filter((t) => t.firestoreId !== firestoreId));
      toast.success("Transaction deleted.");
    } catch (err) {
      toast.error("Failed to delete transaction.");
      console.error(err);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Recent Transactions</div>
          <div className="panel-subtitle">{transactions.length} record{transactions.length !== 1 ? "s" : ""} found</div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <Receipt />
          <p>No transactions yet. Add one above.</p>
        </div>
      ) : (
        <table className="tx-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.firestoreId || item.id}>
                <td className="tx-title">{item.title}</td>
                <td>
                  <span className={`tx-category ${CAT_CLASS[item.category] || "cat-other"}`}>
                    {item.category}
                  </span>
                </td>
                <td>
                  <span className={`tx-amount ${item.amount > 0 ? "positive" : "negative"}`}>
                    {item.amount > 0 ? "+" : ""}₹{Math.abs(item.amount).toLocaleString("en-IN")}
                  </span>
                </td>
                <td className="tx-date">{item.date}</td>
                <td>
                  <div className="tx-actions">
                    <button className="action-btn edit" onClick={() => setEditData(item)}>Edit</button>
                    <button className="action-btn del" onClick={() => deleteTransaction(item.firestoreId)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transactions;
