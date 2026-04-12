import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";

const Header = () => {
  const [active, setActive] = useState("");
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-6 py-4 text-white shadow-lg">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Citizen Portal</p>
        <div className="text-2xl font-semibold">
          <Link to="/" className="hover:text-cyan-200">{t("nagrikConnectAI")}</Link>
        </div>
      </div>

      <nav className="relative">
        <ul className="flex items-center gap-3 sm:gap-6">
          {[
            { name: t("home"), path: "/homepage" },
            { name: t("contactUs"), path: "/homepage/contact" },
          ].map((item, index) => (
            <li
              key={index}
              onClick={() => setActive(item.name)}
              className="group relative cursor-pointer px-3 py-2 transition"
            >
              <span
                className={`absolute inset-0 rounded-full bg-white transition-all duration-300 ease-in-out 
                ${
                  active === item.name
                    ? "opacity-100 scale-x-100"
                    : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                }`}
              ></span>
              <Link
                to={item.path}
                className={`relative z-10 transition-colors duration-300 ${
                  active === item.name ? "text-slate-950" : "group-hover:text-slate-950"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
