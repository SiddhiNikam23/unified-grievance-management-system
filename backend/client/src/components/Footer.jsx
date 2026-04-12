import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
export default function Footer() {
    const { language } = useLanguage();
    const t = (key) => getTranslation(language, key);
    return (
      <footer className="mt-10">
        {}
        <div className="bg-blue-700 text-white py-4 text-center px-4">
          <p className="text-sm">
            {t("footerDesignedBy")}
          </p>
        </div>
        {}
        <div className="bg-gray-900 text-gray-300 py-3 text-center px-4 text-xs">
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
  