import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CashFlowCalendar({ transactions }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  // Parse DD/MM/YYYY
  const parseDate = (str) => {
    if (!str) return null;
    const parts = str.split("/");
    if (parts.length === 3) return new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
    return new Date(str);
  };

  // Group transactions by day
  const dayMap = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = parseDate(t.date);
      if (!d || isNaN(d)) return;
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      if (!map[day]) map[day] = { income: 0, expense: 0, items: [] };
      if (t.amount > 0) map[day].income += t.amount;
      else map[day].expense += Math.abs(t.amount);
      map[day].items.push(t);
    });
    return map;
  }, [transactions, year, month]);

  // Monthly summary
  const monthIncome  = Object.values(dayMap).reduce((s, d) => s + d.income, 0);
  const monthExpense = Object.values(dayMap).reduce((s, d) => s + d.expense, 0);
  const activeDays   = Object.keys(dayMap).length;

  // Calendar grid
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells       = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            💸 Cash Flow Calendar
          </div>
          <div className="panel-subtitle">Daily income and spending at a glance</div>
        </div>

        {/* Navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={prevMonth} style={navBtn}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", minWidth: 150, textAlign: "center" }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{ ...navBtn, opacity: isCurrentMonth ? 0.3 : 1, cursor: isCurrentMonth ? "not-allowed" : "pointer" }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Monthly summary strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Month Income",  value: fmt(monthIncome),  color: "var(--income)"  },
          { label: "Month Expense", value: fmt(monthExpense), color: "var(--expense)" },
          { label: "Net",           value: fmt(monthIncome - monthExpense), color: monthIncome >= monthExpense ? "var(--income)" : "var(--expense)" },
          { label: "Active Days",   value: `${activeDays} days`, color: "var(--balance)" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 110, background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const data      = dayMap[day];
          const isToday   = isCurrentMonth && day === today.getDate();
          const hasIncome = data?.income > 0;
          const hasExp    = data?.expense > 0;
          const net       = (data?.income || 0) - (data?.expense || 0);
          const isFuture  = isCurrentMonth && day > today.getDate();

          let bg     = "var(--bg-elevated)";
          let border = "1px solid var(--border)";

          if (data) {
            if (hasIncome && hasExp) { bg = "rgba(124,156,255,0.08)";  border = "1px solid rgba(124,156,255,0.2)"; }
            else if (hasIncome)      { bg = "rgba(0,229,195,0.08)";    border = "1px solid rgba(0,229,195,0.2)"; }
            else if (hasExp)         { bg = "rgba(255,77,109,0.08)";   border = "1px solid rgba(255,77,109,0.2)"; }
          }

          if (isToday) border = "2px solid var(--accent)";

          return (
            <div
              key={day}
              style={{
                borderRadius: 10, padding: "8px 6px", background: bg, border,
                minHeight: 72, cursor: data ? "pointer" : "default",
                transition: "all 0.15s", opacity: isFuture ? 0.35 : 1,
                position: "relative",
              }}
              onMouseEnter={e => {
                if (data) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; setTooltip(day); }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; setTooltip(null);
              }}
            >
              {/* Day number */}
              <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--accent)" : "var(--text-secondary)", marginBottom: 4, textAlign: "center" }}>
                {day}
              </div>

              {/* Dots */}
              {data && (
                <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 4 }}>
                  {hasIncome && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--income)" }} />}
                  {hasExp    && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--expense)" }} />}
                </div>
              )}

              {/* Net amount */}
              {data && (
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, textAlign: "center", color: net >= 0 ? "var(--income)" : "var(--expense)" }}>
                  {net >= 0 ? "+" : "−"}{fmt(net)}
                </div>
              )}

              {/* Tooltip */}
              {tooltip === day && data && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                  transform: "translateX(-50%)", zIndex: 50,
                  background: "var(--bg-elevated)", border: "1px solid var(--border-strong)",
                  borderRadius: 10, padding: "10px 12px", minWidth: 160,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)", pointerEvents: "none",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    {day} {MONTHS[month]}
                  </div>
                  {hasIncome && (
                    <div style={{ fontSize: 12, color: "var(--income)", marginBottom: 3 }}>
                      ↑ Income: {fmt(data.income)}
                    </div>
                  )}
                  {hasExp && (
                    <div style={{ fontSize: 12, color: "var(--expense)", marginBottom: 3 }}>
                      ↓ Expense: {fmt(data.expense)}
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 4 }}>
                    {data.items.map((t, i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>
                        · {t.title} ({fmt(t.amount)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {[
          { color: "var(--income)",  label: "Income only" },
          { color: "var(--expense)", label: "Expense only" },
          { color: "var(--balance)", label: "Both" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            {l.label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, border: "2px solid var(--accent)" }} />
          Today
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-secondary)", cursor: "pointer",
  padding: "6px 10px", display: "flex", alignItems: "center", transition: "all 0.15s",
};

export default CashFlowCalendar;