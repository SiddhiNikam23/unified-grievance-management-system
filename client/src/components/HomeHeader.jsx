import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";

function HomeHeader() {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  return (
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Citizen Dashboard</p>
        <h1 className="mt-2 text-[44px] font-bold leading-tight text-slate-900 sm:text-[52px]">{t("welcomeTitle")}</h1>
        <p className="mt-2 max-w-3xl text-[18px] text-slate-600">{t("welcomeSubtitle")}</p>
      </div>
    </header>
  )
}

export default HomeHeader
