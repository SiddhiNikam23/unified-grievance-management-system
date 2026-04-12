import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const Header = () => {
  const [active, setActive] = useState("");
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  return (
    <header className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
      {}
      <div className="text-2xl font-bold">
        <Link to="/" className="hover:text-gray-300">{t("nagrikConnectAI")}</Link>
      </div>
      {}
      <nav className="relative">
        <ul className="flex space-x-6">
          {[
            { name: t("home"), path: "/homepage" },
            { name: t("contactUs"), path: "/homepage/contact" },
          ].map((item, index) => (
            <li
              key={index}
              onClick={() => setActive(item.name)}
              className="relative cursor-pointer px-4 py-2 transition group"
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
              <Link
                to={item.path}
                className={`relative z-10 transition-colors duration-300 ${
                  active === item.name ? "text-blue-900" : "group-hover:text-blue-900"
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
