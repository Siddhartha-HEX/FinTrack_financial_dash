import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, AlertTriangle, Award,
  Calendar, Zap, ThumbsUp, Info,
} from "lucide-react";

const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

const parseDate = (str) => {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length === 3)
    return new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
  return new Date(str);
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function InsightCard({ icon: Icon, title, detail, type }) {
  const colors = {
    success: { bg: "rgba(0,229,195,0.07)",  border: "rgba(0,229,195,0.2)",  icon: "var(--income)",  text: "var(--income)"  },
    warning: { bg: "rgba(245,166,35,0.07)", border: "rgba(245,166,35,0.2)", icon: "var(--warning)", text: "var(--warning)" },
    danger:  { bg: "rgba(255,77,109,0.07)", border: "rgba(255,77,109,0.2)", icon: "var(--expense)", text: "var(--expense)" },
    info:    { bg: "rgba(124,156,255,0.07)",border: "rgba(124,156,255,0.2)",icon: "var(--balance)", text: "var(--balance)" },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "14px 16px", borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`,
      marginBottom: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${c.icon}18`, color: c.icon,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function SpendingInsights({ transactions }) {

  const insights = useMemo(() => {
    if (transactions.length === 0) return [];

    const now       = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

    const result = [];

    // Split transactions into this month / last month
    const thisMo = transactions.filter(t => {
      const d = parseDate(t.date);
      return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const lastMo = transactions.filter(t => {
      const d = parseDate(t.date);
      return d && d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    });

    const thisIncome  = thisMo.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const thisExpense = thisMo.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const lastExpense = lastMo.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const lastIncome  = lastMo.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

    // ── 1. Savings rate ──
    if (thisIncome > 0) {
      const rate = ((thisIncome - thisExpense) / thisIncome * 100).toFixed(1);
      if (rate >= 30) {
        result.push({ icon: ThumbsUp, type: "success", title: `Great savings rate this month — ${rate}%`, detail: `You saved ${fmt(thisIncome - thisExpense)} out of ${fmt(thisIncome)} earned. Keep it up!` });
      } else if (rate > 0) {
        result.push({ icon: Info, type: "warning", title: `Savings rate is ${rate}% this month`, detail: `You saved ${fmt(thisIncome - thisExpense)}. Try to aim for 30% or more.` });
      } else {
        result.push({ icon: AlertTriangle, type: "danger", title: `You're spending more than you earn this month`, detail: `Expenses (${fmt(thisExpense)}) exceed income (${fmt(thisIncome)}) by ${fmt(thisExpense - thisIncome)}.` });
      }
    }

    // ── 2. Month-over-month expense change ──
    if (lastExpense > 0 && thisExpense > 0) {
      const pct = (((thisExpense - lastExpense) / lastExpense) * 100).toFixed(1);
      if (pct > 10) {
        result.push({ icon: TrendingUp, type: "danger", title: `Spending up ${pct}% vs last month`, detail: `This month: ${fmt(thisExpense)} vs last month: ${fmt(lastExpense)}. You spent ${fmt(thisExpense - lastExpense)} more.` });
      } else if (pct < -10) {
        result.push({ icon: TrendingDown, type: "success", title: `Spending down ${Math.abs(pct)}% vs last month`, detail: `This month: ${fmt(thisExpense)} vs last month: ${fmt(lastExpense)}. Great job cutting back ${fmt(lastExpense - thisExpense)}!` });
      } else {
        result.push({ icon: Info, type: "info", title: `Spending is consistent with last month`, detail: `This month: ${fmt(thisExpense)} vs last month: ${fmt(lastExpense)} — only ${Math.abs(pct)}% difference.` });
      }
    }

    // ── 3. Month-over-month income change ──
    if (lastIncome > 0 && thisIncome > 0) {
      const pct = (((thisIncome - lastIncome) / lastIncome) * 100).toFixed(1);
      if (pct > 10) {
        result.push({ icon: TrendingUp, type: "success", title: `Income up ${pct}% vs last month`, detail: `This month: ${fmt(thisIncome)} vs last month: ${fmt(lastIncome)}. ${fmt(thisIncome - lastIncome)} more earned!` });
      } else if (pct < -10) {
        result.push({ icon: TrendingDown, type: "warning", title: `Income down ${Math.abs(pct)}% vs last month`, detail: `This month: ${fmt(thisIncome)} vs last month: ${fmt(lastIncome)}. Keep an eye on your income sources.` });
      }
    }

    // ── 4. Biggest spending category this month ──
    const catMap = {};
    thisMo.filter(t => t.amount < 0).forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const pct = thisExpense > 0 ? ((topCat[1] / thisExpense) * 100).toFixed(0) : 0;
      const type = pct > 50 ? "warning" : "info";
      result.push({ icon: Award, type, title: `${topCat[0]} is your biggest expense this month`, detail: `You spent ${fmt(topCat[1])} on ${topCat[0]} — ${pct}% of total expenses this month.` });
    }

    // ── 5. Busiest spending day of week ──
    const dayCount = Array(7).fill(0);
    const dayTotal = Array(7).fill(0);
    transactions.filter(t => t.amount < 0).forEach(t => {
      const d = parseDate(t.date);
      if (!d || isNaN(d)) return;
      dayCount[d.getDay()]++;
      dayTotal[d.getDay()] += Math.abs(t.amount);
    });
    const busiestDay = dayTotal.indexOf(Math.max(...dayTotal));
    if (dayTotal[busiestDay] > 0) {
      result.push({ icon: Calendar, type: "info", title: `You spend the most on ${DAYS[busiestDay]}s`, detail: `${fmt(dayTotal[busiestDay])} spent across ${dayCount[busiestDay]} transactions on ${DAYS[busiestDay]}s overall.` });
    }

    // ── 6. Largest single transaction this month ──
    const largest = thisMo.filter(t => t.amount < 0).sort((a, b) => a.amount - b.amount)[0];
    if (largest) {
      result.push({ icon: Zap, type: "warning", title: `Biggest single expense: ${largest.title}`, detail: `${fmt(largest.amount)} on ${largest.date} under ${largest.category}.` });
    }

    // ── 7. No expense days ──
    if (thisMo.length > 0) {
      const expDays = new Set(thisMo.filter(t => t.amount < 0).map(t => parseDate(t.date)?.getDate()).filter(Boolean));
      const daysGone = Math.min(now.getDate(), new Date(thisYear, thisMonth + 1, 0).getDate());
      const noSpendDays = daysGone - expDays.size;
      if (noSpendDays > 0) {
        result.push({ icon: ThumbsUp, type: "success", title: `${noSpendDays} no-spend day${noSpendDays > 1 ? "s" : ""} this month`, detail: `Out of ${daysGone} days so far, you had no expenses on ${noSpendDays} of them. Nice!` });
      }
    }

    return result;
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={16} color="var(--accent)" />
            Spending Insights
          </div>
          <div className="panel-subtitle">Auto-generated analysis based on your transactions</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 12px" }}>
          {insights.length} insights
        </div>
      </div>

      {insights.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
          Add more transactions to generate insights.
        </div>
      ) : (
        insights.map((ins, i) => (
          <InsightCard key={i} {...ins} />
        ))
      )}
    </div>
  );
}

export default SpendingInsights;