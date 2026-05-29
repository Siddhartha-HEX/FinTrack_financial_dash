import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";

function Transactions({ transactions, setTransactions, setEditData }) {

  const deleteTransaction = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "transactions", firestoreId));
      setTransactions(transactions.filter((item) => item.firestoreId !== firestoreId));
    } catch (error) {
      console.log(error);
    }
  };

  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0);

  const formatAmount = (amount) => {
    const num = Number(amount);
    const abs = Math.abs(num).toLocaleString("en-IN");
    return num >= 0 ? `+₹${abs}` : `−₹${abs}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" });
  };

  const getCatClass = (category = "") =>
    "tx-category-badge cat-" + category.toLowerCase().replace(/[^a-z]/g, "");

  return (
    <div className="transactions">

      <h2>Recent Transactions</h2>

      {transactions.length === 0 ? (
        <div className="empty-state">No transactions yet. Add one above!</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((item) => {
                const isPositive = Number(item.amount) >= 0;
                return (
                  <tr key={item.firestoreId || item.id}>

                    <td>{item.title}</td>

                    <td>
                      <span className={getCatClass(item.category)}>
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <span className={`tx-type-badge ${isPositive ? "credit" : "debit"}`}>
                        {isPositive ? "Credit" : "Debit"}
                      </span>
                    </td>

                    <td>
                      <span className={isPositive ? "amount-positive" : "amount-negative"}>
                        {formatAmount(item.amount)}
                      </span>
                    </td>

                    <td>{formatDate(item.date)}</td>

                    <td>
                      <div className="tx-actions-cell">
                        <button
                          className="edit-btn"
                          title="Edit"
                          onClick={() => setEditData(item)}
                        >
                          ✏
                        </button>
                        <button
                          className="delete-btn"
                          title="Delete"
                          onClick={() => deleteTransaction(item.firestoreId)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={3}>
                  Total ({transactions.length} transaction{transactions.length !== 1 ? "s" : ""})
                </td>
                <td>
                  <span className={`total-amount ${total >= 0 ? "amount-positive" : "amount-negative"}`}>
                    {formatAmount(total)}
                  </span>
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>

          <div className="tx-pagination">
            <span className="tx-pagination-info">
              Showing 1–{transactions.length} of {transactions.length}
            </span>
            <div className="tx-pagination-btns">
              <button className="tx-pg-btn" disabled>‹‹</button>
              <button className="tx-pg-btn" disabled>‹</button>
              <button className="tx-pg-btn active">1</button>
              <button className="tx-pg-btn" disabled>›</button>
              <button className="tx-pg-btn" disabled>››</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Transactions;