import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
export default function Status() {
  const [grievanceCode, setGrievanceCode] = useState("");
  const [grievance, setGrievance] = useState(null);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/grievance/grievanceCode/${grievanceCode}`);
      if (!response.ok) {
        throw new Error(t("grievanceNotFound"));
      }
      const data = await response.json();
      setGrievance(data);
    } catch (error) {
      setError(error.message);
    }
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-lg w-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-8">
        {}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{t("trackYourGrievance")}</h2>
          <p className="text-gray-500 mt-1">{t("enterGrievanceCode")}</p>
        </div>
        {!grievance ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            <div>
              <label className="text-sm font-semibold text-gray-600">{t("grievanceCode")}</label>
              <input
                type="text"
                value={grievanceCode}
                onChange={(e) => setGrievanceCode(e.target.value)}
                placeholder={t("enterYourGrievanceCode")}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
            {}
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            {}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ffb703] to-[#fb8500] text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg  hover:cursor-pointer transition-all duration-300"
            >
              {t("checkStatus")}
            </button>
          </form>
        ) : (
          <div className="p-5 bg-white/80 backdrop-blur-lg border border-gray-200 rounded-lg shadow-xl transition-all">
            <h2 className="text-lg font-bold text-center text-gray-800 mb-4">
              {t("grievanceDetails")}
            </h2>
            <div className="space-y-3">
              <p><span className="font-semibold text-gray-700">{t("name")}:</span> {grievance.complainantName}</p>
              <p><span className="font-semibold text-gray-700">{t("email")}:</span> {grievance.complainantEmail}</p>
              <p><span className="font-semibold text-gray-700">{t("department")}:</span> {grievance.department}</p>
              <p><span className="font-semibold text-gray-700">{t("description")}:</span> {grievance.description}</p>
              <p>
                <span className="font-semibold text-gray-700">{t("status")}:</span>
                <span className="text-blue-600 font-semibold"> {grievance.currentStatus}</span>
              </p>
              <p><span className="font-semibold text-gray-700">{t("createdAt")}:</span> {new Date(grievance.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold text-gray-700">{t("lastUpdated")}:</span> {new Date(grievance.updatedAt).toLocaleString()}</p>
            </div>
            {}
            <div className="text-center mt-6">
              <button
                onClick={() => setGrievance(null)}
                className="w-full  bg-gradient-to-r from-[#ffb703] to-[#fb8500] text-white py-3 rounded-lg font-semibold shadow-md hover:bg-gray-600 hover:cursor-pointer transition-all duration-300"
              >
                {t("trackAnotherGrievance")}
              </button>
            </div>
          </div>
        )}
        {}
        <p className="text-sm text-gray-500 mt-4 text-center">
          {t("byUsingService")}{" "}
          <a href="#" className="text-blue-600 underline">{t("termsOfService")}</a> {t("and")}{" "}
          <a href="#" className="text-blue-600 underline">{t("privacyPolicy")}</a>.
        </p>
      </div>
    </div>
  );
}
