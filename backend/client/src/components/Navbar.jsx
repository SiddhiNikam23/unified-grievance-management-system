import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const Navbar = () => {
  const [active, setActive] = useState("Home");
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const navItems = [
    { name: t("home"), path: "/" },
    { name: t("howItWorks"), path: "/how-it-works" },
    { name: t("faqs"), path: "/faqs" },
    { name: t("fileGrievance"), path: "/complaints" },
    { name: t("contact"), path: "/contact" },
  ];
  return (
    <header className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center shadow-md relative">
      <Link to={"/"} className="text-2xl font-bold">{t("nagrikConnectAI")}</Link>
      <nav className="absolute left-1/2 transform -translate-x-1/2">
        <ul className="flex space-x-6 relative">
          {navItems.map((item, index) => (
            <li
              key={index}
              className="relative cursor-pointer px-4 py-2 transition group"
              onClick={() => setActive(item.name)}
            >
              {}
              <span
                className={`absolute inset-0 bg-white rounded-full transition-all duration-300 ease-in-out 
                  ${
                    active === item.name
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                  }`}
              ></span>
              {}
              <Link to={item.path}>
                <span
                  className={`relative z-10 transition-colors duration-300 ${
                    active === item.name ? "text-blue-900" : "group-hover:text-blue-900"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-4">
        <button
          className="bg-orange-500 px-6 py-3 rounded-md hover:bg-orange-600 transition"
          onClick={() => navigate("/login")}
        >
          {t("login")}
        </button>
      </div>
    </header>
  );
};
export default Navbar;
