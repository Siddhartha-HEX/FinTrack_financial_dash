import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Receipt,
  ArrowUpCircle, ArrowDownCircle, Award, AlertTriangle,
} from "lucide-react";
import CashFlowCalendar from "../components/CashFlowCalendar";
import SpendingInsights from "../components/SpendingInsights";

const COLORS = [
  "#00e5c3","#ff4d6d","#7c9cff","#f5a623",
  "#a78bfa","#34d399","#fb923c","#60a5fa",
  "#f472b6","#facc15","#2dd4bf","#818cf8",
];

const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-strong)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 13,
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${color}` }}>
      <div className="stat-card-icon" style={{ background: `${color}18`, color }}>
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function Analytics({ transactions }) {

  const stats = useMemo(() => {
    const income  = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const balance = income - expense;
    const savings = income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0;

    // Category breakdown
    const catMap = {};
    transactions.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { income: 0, expense: 0 };
      if (t.amount > 0) catMap[t.category].income += t.amount;
      else catMap[t.category].expense += Math.abs(t.amount);
    });

    const categoryData = Object.entries(catMap)
      .map(([name, v]) => ({ name, income: v.income, expense: v.expense, total: v.income + v.expense }))
      .sort((a, b) => b.total - a.total);

    const expensePie = Object.entries(catMap)
      .filter(([, v]) => v.expense > 0)
      .map(([name, v]) => ({ name, value: v.expense }))
      .sort((a, b) => b.value - a.value);

    
    // Monthly trend
    const monthMap = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0 };
      if (t.amount > 0) monthMap[key].income += t.amount;
      else monthMap[key].expense += Math.abs(t.amount);
    });

    const monthlyTrend = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ ...m, net: m.income - m.expense }));

    // Top 5
    const topExpenses = [...transactions]
      .filter(t => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 5);

    const topIncomes = [...transactions]
      .filter(t => t.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { income, expense, balance, savings, categoryData, expensePie, monthlyTrend, topExpenses, topIncomes };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)" }}>
        <Receipt size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
        <p style={{ fontSize: 15 }}>No transactions yet — add some to see analytics.</p>
      </div>
    );
  }

  return (
    <div>

      {/* ── Header ── */}
      <div className="page-header">
        <h1>Analytics</h1>
        <p>A full breakdown of your income, spending, and trends.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="cards-grid">
        <StatCard icon={Wallet}           label="Net Balance"     value={fmt(stats.balance)}  color="var(--balance)" sub={stats.balance >= 0 ? "You're in the green" : "Spending exceeds income"} />
        <StatCard icon={ArrowUpCircle}    label="Total Income"    value={fmt(stats.income)}   color="var(--income)" />
        <StatCard icon={ArrowDownCircle}  label="Total Expenses"  value={fmt(stats.expense)}  color="var(--expense)" />
        <StatCard icon={TrendingUp}       label="Savings Rate"    value={`${stats.savings}%`} color="var(--warning)"  sub="of total income saved" />
        <StatCard icon={Receipt}          label="Transactions"    value={transactions.length}  color="var(--text-secondary)" />
        <StatCard icon={Award}            label="Top Category"    value={stats.categoryData[0]?.name || "—"} color="var(--accent)" sub={stats.categoryData[0] ? fmt(stats.categoryData[0].total) + " total" : ""} />
      </div>

      {/* ── Spending Insights ── */}
      <SpendingInsights transactions={transactions} />

      {/* ── Monthly trend ── */}
      {stats.monthlyTrend.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Monthly Trend</div>
              <div className="panel-subtitle">Income vs expenses over time</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.monthlyTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income"  name="Income"  stroke="var(--income)"  strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="var(--expense)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="net"     name="Net"     stroke="var(--balance)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Category bar + Expense pie ── */}
      <div className="chart-row">

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Spending by Category</div>
              <div className="panel-subtitle">Income and expense per category</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.categoryData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income"  name="Income"  fill="var(--income)"  radius={[0, 4, 4, 0]} />
              <Bar dataKey="expense" name="Expense" fill="var(--expense)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Expense Distribution</div>
              <div className="panel-subtitle">Where your money goes</div>
            </div>
          </div>
          {stats.expensePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.expensePie}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  dataKey="value" nameKey="name"
                  paddingAngle={2}
                >
                  {stats.expensePie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 10, fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No expense data
            </div>
          )}
        </div>

      </div>

      {/* ── Top 5 tables ── */}
      <div className="chart-row">

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Top Expenses</div>
              <div className="panel-subtitle">Your 5 biggest outgoings</div>
            </div>
            <AlertTriangle size={16} color="var(--expense)" />
          </div>
          {stats.topExpenses.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No expenses yet.</p>
          ) : (
            stats.topExpenses.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < stats.topExpenses.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--expense-dim)", color: "var(--expense)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.category} · {t.date}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--expense)" }}>
                  −{fmt(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Top Income Sources</div>
              <div className="panel-subtitle">Your 5 biggest earnings</div>
            </div>
            <TrendingUp size={16} color="var(--income)" />
          </div>
          {stats.topIncomes.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No income yet.</p>
          ) : (
            stats.topIncomes.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < stats.topIncomes.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--income-dim)", color: "var(--income)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.category} · {t.date}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--income)" }}>
                  +{fmt(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ── Cash Flow Calendar ── */}
      <CashFlowCalendar transactions={transactions} />


    </div>
  );
}

export default Analytics;