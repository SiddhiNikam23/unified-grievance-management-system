import { Link, useNavigate } from "react-router-dom";
import { Home, BarChart3, AlertTriangle, Radio, Radar } from "lucide-react"; 
const Sidebar = () => {
  const navigate = useNavigate();
  const menuItems = [
    { name: "My Clients", path: "/clients", icon: <Home size={20} /> },
    { name: "Emergency Response", path: "/emergency", icon: <AlertTriangle size={20} className="text-red-300" /> },
    { name: "Future Prediction", path: "/future-prediction", icon: <Radar size={20} className="text-cyan-200" /> },
    { name: "Social Listener", path: "/social-complaints", icon: <Radio size={20} className="text-yellow-200" /> },
    { name: "Insights", path: "/quotes", icon: <BarChart3 size={20} /> },
  ];
  const handleLogout = () => {
    document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminDepartment');
    navigate('/login');
  };
  return (
    <div className="w-64 h-screen bg-gradient-to-b from-green-900 to-green-700 text-white flex flex-col shadow-xl">
      {}
      <h1 className="text-2xl font-bold p-6 tracking-wide text-center border-b border-green-600">
        नागरिक कनेक्ट AI
      </h1>
      {}
      <ul className="flex-1 mt-4">
        {menuItems.map((item, index) => (
          <li key={index} className="group">
            <Link
              to={item.path}
              className="flex items-center space-x-3 p-4 transition-all hover:bg-green-800 hover:scale-105"
            >
              {item.icon}
              <span className="text-lg">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {}
      <div className="p-4 border-t border-green-600">
        <button 
          onClick={handleLogout}
          className="w-full cursor-pointer py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
