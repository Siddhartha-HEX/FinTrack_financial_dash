import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";

function FinanceProgress({ income, expense }) {
  const total = income + Math.abs(expense);
  const incomePercent  = total > 0 ? (income / total) * 100 : 0;
  const expensePercent = total > 0 ? (Math.abs(expense) / total) * 100 : 0;
  const savingsRate    = income > 0 ? ((income - Math.abs(expense)) / income) * 100 : 0;

  return (
    <div className="panel" style={{ height: "100%" }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">Financial Overview</div>
          <div className="panel-subtitle">Income vs Expense ratio</div>
        </div>
        <BarChart2 size={18} color="var(--text-muted)" />
      </div>

      <div className="progress-section">
        <div className="progress-meta">
          <span className="progress-meta-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={13} color="var(--income)" /> Income
          </span>
          <span className="progress-meta-value" style={{ color: "var(--income)" }}>
            {incomePercent.toFixed(0)}% · ₹{income.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill income-fill" style={{ width: `${incomePercent}%` }} />
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-meta">
          <span className="progress-meta-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown size={13} color="var(--expense)" /> Expense
          </span>
          <span className="progress-meta-value" style={{ color: "var(--expense)" }}>
            {expensePercent.toFixed(0)}% · ₹{Math.abs(expense).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill expense-fill" style={{ width: `${expensePercent}%` }} />
        </div>
      </div>

      <div style={{
        marginTop: 24,
        padding: "14px 16px",
        background: "var(--bg-elevated)",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Savings Rate
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          fontWeight: 500,
          color: savingsRate >= 0 ? "var(--income)" : "var(--expense)",
        }}>
          {savingsRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default FinanceProgress;
