import { useState, useEffect } from "react";
import { User, Mail, Globe, Calendar, MapPin, Landmark, Edit3 } from "lucide-react"; 
import { getCookie } from "../utilities/cookie";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const AccountDetails = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  useEffect(() => {
    const token = getCookie('token');
    console.log("Token: ");
    if (token) {
      console.log("Fetching user data...");
      fetch(`http://localhost:5000/user/token/${token}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user data");
          return res.json();
        })
        .then((data) => {
          setUser(data);
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
        });
    }
  }, []);
  if (!user) {
    return <div className="text-center text-gray-500 mt-10">{t('loading')}</div>;
  }
  const personalInfo = [
    { label: t('name'), value: user.name || "N/A", icon: <User size={20} /> },
    { label: t('dateOfBirth'), value: user.dob || "N/A", icon: <Calendar size={20} /> },
    { label: t('language'), value: user.language || "English (US)", icon: <Globe size={20} /> },
    { label: t('contactableAt'), value: user.email || "N/A", icon: <Mail size={20} /> },
  ];
  const addressInfo = user.address
    ? [
        { label: t('state'), value: user.address.state || `${user.address}`, icon: <MapPin size={20} /> },
        { label: t('district'), value: user.address.district || `${user.city}`, icon: <Landmark size={20} /> },
        { label: t('pincode'), value: user.address.pincode || `${user.pincode}`, icon: <Edit3 size={20} /> },
        { label: t('state'), value: user.address.locality || `${user.state}`, icon: <MapPin size={20} /> },
      ]
    : [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className=" min-h-[65vh] max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-6 flex">
        {}
        <div className="w-1/4 pr-8 border-r">
          <h1 className="text-lg font-bold text-gray-800 mb-6">{t('accountDetails')}</h1>
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <User size={32} />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">{user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
          <ul className="space-y-6">
            <li
              onClick={() => setActiveTab("personal")}
              className={`cursor-pointer text-lg font-medium ${
                activeTab === "personal"
                  ? "text-blue-600 border-l-4 border-blue-600 pl-2"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {t('personalInformation')}
            </li>
            <li
              onClick={() => setActiveTab("address")}
              className={`cursor-pointer text-lg font-medium ${
                activeTab === "address"
                  ? "text-blue-600 border-l-4 border-blue-600 pl-2"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {t('address')}
            </li>
            <li
              onClick={() => setActiveTab("status")}
              className={`cursor-pointer text-lg font-medium ${
                activeTab === "status"
                  ? "text-blue-600 border-l-4 border-blue-600 pl-2"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {t('viewStatus')}
            </li>
          </ul>
        </div>
        {}
        <div className="w-3/4 pl-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {activeTab === "personal"
              ? t('personalInformation')
              : activeTab === "address"
              ? t('address')
              : t('viewStatus')}
          </h2>
          <p className="text-gray-600 mb-6">
            {activeTab === "personal"
              ? t('managePersonalDetails')
              : activeTab === "address"
              ? t('viewUpdateAddress')
              : t('trackApplicationStatus')}
          </p>
          {activeTab === "personal" && (
            <div className="grid grid-cols-2 gap-6">
              {personalInfo.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-lg shadow-sm flex items-center justify-between h-32"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">{item.label}</h3>
                    <p className="text-lg text-gray-800">{item.value}</p>
                  </div>
                  <div className="text-blue-600">{item.icon}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "address" && (
            <div className="grid grid-cols-2 gap-6">
              {addressInfo.length > 0 ? (
                addressInfo.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-6 rounded-lg shadow-sm flex items-center justify-between h-32"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">{item.label}</h3>
                      <p className="text-lg text-gray-800">{item.value}</p>
                    </div>
                    <div className="text-blue-600">{item.icon}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">{t('noAddressInfo')}</p>
              )}
            </div>
          )}
          {activeTab === "status" && (
            <div>
              <p className="text-gray-800">{t('viewStatusUnderDevelopment')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AccountDetails;
