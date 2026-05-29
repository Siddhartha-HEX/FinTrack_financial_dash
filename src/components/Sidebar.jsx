import { LayoutDashboard, ArrowLeftRight, BarChart2, Wallet } from "lucide-react";

const items = [
  { label: "Dashboard",    page: "Dashboard",    icon: LayoutDashboard },
  { label: "Transactions", page: "Transactions", icon: ArrowLeftRight  },
  { label: "Analytics",    page: "Analytics",    icon: BarChart2       },
  { label: "Budget",       page: "Budget",       icon: Wallet          },
];

function Sidebar({ active, setActive }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">Fin<span>Track</span></div>
      <ul className="sidebar-nav">
        {items.map(({ label, page, icon: Icon }) => (
          <li
            key={page}
            className={active === page ? "active" : ""}
            onClick={() => setActive(page)}
          >
            <Icon size={16} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;