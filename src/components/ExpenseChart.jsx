import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#f5a623", "#7c9cff", "#00e5c3", "#ff4d6d", "#a78bfa"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#131920",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        color: "#f0f4f8",
      }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8899aa", marginBottom: 4 }}>
          {payload[0].name}
        </div>
        ₹{payload[0].value.toLocaleString("en-IN")}
      </div>
    );
  }
  return null;
};

function ExpenseChart({ transactions }) {
  const categoryData = transactions
    .filter((item) => item.amount < 0)
    .reduce((acc, item) => {
      const existing = acc.find((d) => d.name === item.category);
      if (existing) {
        existing.value += Math.abs(item.amount);
      } else {
        acc.push({ name: item.category, value: Math.abs(item.amount) });
      }
      return acc;
    }, []);

  return (
    <div className="panel" style={{ height: "100%" }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">Expense Breakdown</div>
          <div className="panel-subtitle">By category</div>
        </div>
      </div>

      {categoryData.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <p>No expense data yet.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
            >
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => (
                <span style={{ color: "#8899aa", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{v}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ExpenseChart;
