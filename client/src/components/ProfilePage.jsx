import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const ProfilePage = ({ setActivePage, showToast }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    gender: "",
    state: "",
    city: "",
    pincode: "",
    address: "",
    phone: ""
  });
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:5000/user/profile", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserData({
          name: data.name || "",
          email: data.email || "",
          gender: data.gender || "",
          state: data.state || "",
          city: data.city || "",
          pincode: data.pincode || "",
          address: data.address || "",
          phone: data.phone || ""
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };
  async function handleSaveProfile(event) {
    event.preventDefault();
    console.log("Saving profile...");
    const response = await fetch("http://localhost:5000/user/profileUpdate", {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: userData.name,
            gender: userData.gender,
            state: userData.state,
            district: userData.city,
            pincode: userData.pincode,
            address: userData.address,
            mobile: userData.phone
        }),
    });
    if (response.status === 200) {
        localStorage.setItem("showProfileUpdateToast", "true");
        alert(t('profileUpdatedSuccess'));
        setActivePage("home");
    } else {
        alert(t('profileUpdateFailed'));
        console.error("Failed to update profile");
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl w-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-2xl p-8"
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-gray-800 mb-8 text-center"
        >
          {t('profileInformation')}
        </motion.h2>
        <form className="space-y-6" onSubmit={handleSaveProfile}>
          {}
          <motion.div whileFocus={{ scale: 1.05 }}>
            <label className="block text-sm font-semibold text-gray-700">{t('emailCannotBeChanged')}</label>
            <input
              type="email"
              value={userData.email}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              disabled
            />
          </motion.div>
          {}
          <motion.div whileFocus={{ scale: 1.05 }}>
            <label className="block text-sm font-semibold text-gray-700">{t('nameRequired')}</label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </motion.div>
          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div whileFocus={{ scale: 1.05 }}>
              <label className="block text-sm font-semibold text-gray-700">{t('genderRequired')}</label>
              <select
                name="gender"
                value={userData.gender}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">{t('selectGender')}</option>
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Other">{t('otherGender')}</option>
              </select>
            </motion.div>
            <motion.div whileFocus={{ scale: 1.05 }}>
              <label className="block text-sm font-semibold text-gray-700">{t('stateRequired')}</label>
              <input
                type="text"
                name="state"
                value={userData.state}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </motion.div>
            <motion.div whileFocus={{ scale: 1.05 }}>
              <label className="block text-sm font-semibold text-gray-700">{t('cityRequired')}</label>
              <input
                type="text"
                name="city"
                value={userData.city}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </motion.div>
          </div>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileFocus={{ scale: 1.05 }}>
              <label className="block text-sm font-semibold text-gray-700">{t('pincode')}</label>
              <input
                type="text"
                name="pincode"
                value={userData.pincode}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>
            <motion.div whileFocus={{ scale: 1.05 }}>
              <label className="block text-sm font-semibold text-gray-700">{t('addressRequired')}</label>
              <input
                type="text"
                name="address"
                value={userData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </motion.div>
          </div>
          {}
          <motion.div whileFocus={{ scale: 1.05 }}>
            <label className="block text-sm font-semibold text-gray-700">{t('mobileNumberRequired')}</label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </motion.div>
          {}
          <div className="flex justify-center mt-8">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 font-medium rounded-lg
                         bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {t('saveProfile')}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
export default ProfilePage;
