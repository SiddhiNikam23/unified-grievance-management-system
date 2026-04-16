import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, AlertTriangle, RadioTower, LogOut, Radar } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "My Clients", path: "/clients", icon: <Home size={20} /> },
    { name: "Social Complaints", path: "/social-complaints", icon: <RadioTower size={20} /> },
    { name: "Emergency Response", path: "/emergency", icon: <AlertTriangle size={20} /> },
    { name: "Future Prediction", path: "/future-prediction", icon: <Radar size={20} /> },
    { name: "Insights", path: "/quotes", icon: <BarChart3 size={20} /> },
  ];

  const handleLogout = () => {
    document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminDepartment');
    navigate('/login');
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-slate-950 px-4 py-5 text-slate-100 shadow-2xl">
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Nagrik Connect AI</p>
        <h1 className="mt-2 text-xl font-semibold">Admin Command</h1>
      </div>

      <ul className="flex-1 space-y-2">
        {menuItems.map((item, index) => (
          <li key={index} className="group">
            <Link
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                location.pathname === item.path
                  ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-300/40"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t border-white/10 pt-4">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
