import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
function HomeHeader() {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  return (
    <header className="bg-gradient-to-r from-blue-500 to-purple-600 py-10 text-center shadow-md">
        <h1 className="text-4xl font-bold text-white">{t("welcomeTitle")}</h1>
        <p className="mt-2 text-white">{t("welcomeSubtitle")}</p>
    </header>
  )
}
export default HomeHeader
