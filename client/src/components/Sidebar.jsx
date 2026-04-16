import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
export default function Sidebar() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  function logout() {
    console.log("Logging out");
    deleteCookie('token');
    if (!document.cookie.includes('token')) navigate('/');
  }
  return (
    <div className="w-64 p-5 rounded-2xl bg-gradient-to-b from-blue-900 to-blue-600 shadow-xl backdrop-blur-md text-white flex flex-col">
      { }
      { }
      { }
      <ul className="space-y-3 overflow-y-auto flex-grow">
        <SidebarItem
          icon="📺"
          text={<Link to="/" className="no-underline text-inherit">{t("appealDashboard")}</Link>}
          badge={t("appealDashboardBadge")}
        />
        <SidebarItem
          id="sidebar-new-grievance"
          icon="➕"
          text={<Link to="/newGrievanceOrganisation" className="no-underline text-inherit">{t("lodgeGrievance")}</Link>}
        />
        <SidebarItem icon="➕" text={t("lodgePensionGrievance")} />
        <SidebarItem id="sidebar-status" icon="➕" text={t("checkStatus")} />
        <SidebarItem icon="🔄" text={t("accountActivity")} />
        <SidebarItem
          icon="✏️"
          text={<Link to="/profile" className="no-underline text-inherit">{t("editProfile")}</Link>}
        />
        <SidebarItem
          icon="🔒"
          text={<Link to="/change-password" className="no-underline text-inherit">{t("changePassword")}</Link>}
        />
        <SidebarItem
          icon="🔌"
          text={t("signOut")}
          special
          onClick={logout}
        />
      </ul>
    </div>
  );
}
function SidebarItem({ id, icon, text, badge, special, onClick }) {
  return (
    <li
      id={id}
      className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-md ${special ? "bg-red-600 hover:bg-red-700 text-white" : "bg-white/20 hover:bg-white/30 text-white"
        }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <span className="text-md">{icon}</span>
        <span className="text-sm font-small">{text}</span>
      </div>
      {badge && (
        <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-600 rounded-full">
          {badge}
        </span>
      )}
    </li>
  );
}