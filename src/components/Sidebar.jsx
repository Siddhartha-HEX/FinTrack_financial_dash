import { LayoutDashboard, ArrowLeftRight, BarChart2, Target, Settings } from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: ArrowLeftRight,  label: "Transactions" },
  { icon: BarChart2,       label: "Analytics" },
  { icon: Target,          label: "Budget" },
  { icon: Settings,        label: "Settings" },
];

const COMING_SOON = ["Analytics", "Budget", "Settings"];

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Fin<span>Track</span></div>
      <ul className="sidebar-nav">
        {NAV.map(({ icon: Icon, label }) => {
          const isSoon = COMING_SOON.includes(label);
          return (
            <li
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => !isSoon && setActive(label)}
              style={isSoon ? { opacity: 0.4, cursor: "not-allowed" } : { cursor: "pointer" }}
              title={isSoon ? "Coming soon" : label}
            >
              <Icon />
              <span style={{ flex: 1 }}>{label}</span>
              {isSoon && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}>Soon</span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Sidebar;