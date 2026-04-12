import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";

export default function Footer() {
    const { language } = useLanguage();
    const t = (key) => getTranslation(language, key);
    return (
      <footer className="mt-10">
        <div className="bg-slate-950 px-4 py-4 text-center text-white">
          <p className="text-sm text-slate-200">
            {t("footerDesignedBy")}
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-3 text-center text-xs text-slate-300">
          <p>{t("footerCompatibility")}</p>
          <p>{t("footerBestViewed")}</p>
          <p>
            <span className="mr-2">{t("disclaimer")}</span> | 
            <span className="ml-2 mr-2">{t("websitePolicies")}</span> | 
            <span className="ml-2 mr-2">{t("webInfoManager")}</span> | 
            <span className="ml-2">{t("version")}</span>
          </p>
          <p>{t("copyright")}</p>
          <p>{t("totalVisitors")}</p>
        </div>
      </footer>
    );
  }
  