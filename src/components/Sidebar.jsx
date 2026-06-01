import { LayoutDashboard, ArrowLeftRight, BarChart2, Wallet, Target, Settings } from "lucide-react";

const items = [
  { label: "Dashboard",    page: "Dashboard",    icon: LayoutDashboard },
  { label: "Transactions", page: "Transactions", icon: ArrowLeftRight  },
  { label: "Analytics",    page: "Analytics",    icon: BarChart2       },
  { label: "Budget",       page: "Budget",       icon: Wallet          },
  { label: "Goals",        page: "Goals",        icon: Target          },
];

function Sidebar({ active, setActive }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">Fin<span>Track</span></div>
      <ul className="sidebar-nav" style={{ flex: 1 }}>
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
      {/* Settings at bottom */}
      <div className="sidebar-bottom">
        <ul className="sidebar-nav">
          <li
            className={active === "Settings" ? "active" : ""}
            onClick={() => setActive("Settings")}
          >
            <Settings size={16} />
            Settings
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;