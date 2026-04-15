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
    { name: t("contact"), path: "/contact" },
  ];

  return (
    <header className="relative flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 text-slate-900 shadow-sm">
      
      {/* Logo */}
      <Link
        to={"/"}
        className="text-xl font-semibold tracking-tight text-teal-900"
      >
        {t("nagrikConnectAI")}
      </Link>

      {/* Navigation */}
      <nav>
        <ul className="relative flex items-center space-x-2">
          {navItems.map((item, index) => (
            <li
              key={index}
              className="group relative cursor-pointer px-3 py-1.5 text-sm font-medium transition"
              onClick={() => setActive(item.name)}
            >
              <span
                className={`absolute inset-0 rounded-full bg-slate-100 transition-all duration-300 ease-in-out 
                  ${
                    active === item.name
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                  }`}
              ></span>

              <Link to={item.path}>
                <span
                  className={`relative z-10 transition-colors duration-300 ${
                    active === item.name
                      ? "text-slate-900"
                      : "text-slate-700 group-hover:text-slate-900"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Login Button */}
      <div className="flex items-center gap-4">
        <button
          id="login-btn"   // ✅ IMPORTANT FOR TOUR
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          onClick={() => navigate("/login")}
        >
          {t("login")}
        </button>
      </div>

    </header>
  );
};

export default Navbar;