import { LayoutDashboard, ArrowLeftRight, BarChart2, Target, Settings } from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: ArrowLeftRight, label: "Transactions" },
  { icon: BarChart2,      label: "Analytics"    },
  { icon: Target,         label: "Budget"        },
  { icon: Settings,       label: "Settings"      },
];

function Sidebar({ active = "Dashboard" }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Fin<span>Track</span></div>
      <ul className="sidebar-nav">
        {NAV.map(({ icon: Icon, label }) => (
          <li key={label} className={active === label ? "active" : ""}>
            <Icon />
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
