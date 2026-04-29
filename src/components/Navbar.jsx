import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Upload,
  Wallet,
  PlusCircle,
  LogOut
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar-menu">
        <NavLink
          to="/"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={isActive("/")}
        />

        <NavLink
          to="/transactions"
          icon={<Receipt size={20} />}
          label="Transactions"
          active={isActive("/transactions")}
        />

        <NavLink
          to="/add-transaction"
          icon={<PlusCircle size={20} />}
          label="Add Transaction"
          active={isActive("/add-transaction")}
        />

        <NavLink
          to="/budget"
          icon={<Wallet size={20} />}
          label="Budget"
          active={isActive("/budget")}
        />

        <NavLink
          to="/upload"
          icon={<Upload size={20} />}
          label="Upload Statement"
          active={isActive("/upload")}
        />
      </div>

      <button onClick={handleLogout} className="logout-button">
        <LogOut size={20} />
        Logout
      </button>
    </nav>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link to={to} className={`navbar-link ${active ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
