import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
export default function Contact() {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-2xl p-8">
        {}
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold text-gray-800">
            {t("getInTouch")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("contactIntro")}
          </p>
          <div>
            <p className="text-lg text-gray-800 font-semibold">
              {t("email")}:
              <a href="mailto:grievances@maharashtragovt.com" className="text-blue-600">
                grievances@maharashtragovt.com
              </a>
            </p>
            <p className="text-lg text-gray-800 font-semibold">
              {t("phone")}: <span className="text-blue-600">+1 800-123-4567</span>
            </p>
          </div>
          <a
            href="./faq"
            className="text-blue-600 font-medium underline hover:text-blue-700"
          >
            {t("faqs")}
          </a>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t("supportHours")}
              </h2>
              <p className="text-gray-600">
                {t("supportHoursTime")}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t("feedbackSuggestions")}
              </h2>
              <p className="text-gray-600">
                {t("feedbackSuggestionsDesc")}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t("mediaInquiries")}</h2>
              <p className="text-lg text-gray-800 font-semibold">
                {t("email")}:
                <a href="mailto:mediasupport@maharashtragovt.com" className="text-blue-600">
                  mediasupport@maharashtragovt.com
                </a>
              </p>
            </div>
          </div>
        </div>
        {}
        <div className="bg-gradient-to-br from-white to-gray-100 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("contactUs")}</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t("firstName")}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder={t("lastName")}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <input
              type="email"
              placeholder={t("yourEmail")}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="grid grid-cols-3 gap-4">
              <select
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="+62">+62</option>
                <option value="+91">+91</option>
                <option value="+1">+1</option>
              </select>
              <input
                type="text"
                placeholder={t("phoneNumber")}
                className="col-span-2 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <textarea
              placeholder={t("howCanWeHelp")}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows="4"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-blue-700 transition-all"
            >
              {t("submit")}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            {t("byContacting")}{" "}
            <a href="#" className="text-blue-600 underline">
              {t("termsOfService")}
            </a>{" "}
            {t("and")}{" "}
            <a href="#" className="text-blue-600 underline">
              {t("privacyPolicy")}
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
