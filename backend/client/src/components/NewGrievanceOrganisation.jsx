import React, { useState } from "react";
import financialServicesGif from "../assets/Bank.gif";
import labourEmploymentGif from "../assets/Labour.gif";
import taxesGif from "../assets/Income.gif";
import postsGif from "../assets/Post.gif";
import telecommunicationsGif from "../assets/Telecomm.gif";
import housingUrbanAffairsGif from "../assets/Housing.gif";
import healthWelfareGif from "../assets/Health.gif";
import training from "../assets/Training.gif";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const Card = ({ icon, title, delay = 0 }) => {
  return (
    <motion.div
      // Initial and animate props control the fade/slide effect on mount
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      // Tailwind classes for hover transitions
      className="flex flex-col items-center justify-center 
                 w-full max-w-xs h-48 border-2 rounded-xl shadow-md 
                 hover:shadow-lg hover:scale-105 transition-transform 
                 duration-300 ease-in-out cursor-pointer"
    >
      {/* Icon Section */}
      <div className="flex justify-center items-center w-full h-24 bg-blue-100 rounded-t-xl">
        <img src={icon} alt={title} className="w-16 h-16" />
      </div>
      {/* Text Section */}
      <div className="flex items-center justify-center w-full h-24 bg-blue-600 rounded-b-xl text-white text-center">
        <p className="text-base font-semibold px-2">{title}</p>
      </div>
    </motion.div>
  );
};

const NewGrievanceOrganisation = ({ setActivePage }) => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const navigate = useNavigate();
  
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIFiling = async () => {
    if (!aiQuestion.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setAiLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/grievance/ai-assistant", {
        question: aiQuestion,
        language: language
      });

      const autofillData = response.data.autofillData;
      if (autofillData) {
        // Store autofill data in localStorage
        localStorage.setItem('grievanceAutofill', JSON.stringify(autofillData));
        
        toast.success(t("formAutoFilled"));
        setShowAIModal(false);
        setAiQuestion("");
        
        // Navigate to grievance form
        if (setActivePage) {
          setActivePage('grievanceForm');
        } else {
          navigate('/homepage', { state: { page: 'grievanceForm' } });
        }
      } else {
        toast.error("Could not extract grievance details. Please try again.");
      }
    } catch (error) {
      console.error("AI filing error:", error);
      toast.error("AI service unavailable. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const cards = [
    {
      icon: financialServicesGif,
      titleKey: "financialServices",
      originalTitle: "Financial Services (Banking Division)",
    },
    {
      icon: labourEmploymentGif,
      titleKey: "labourEmployment",
      originalTitle: "Labour and Employment",
    },
    {
      icon: taxesGif,
      titleKey: "directTaxes",
      originalTitle: "Central Board of Direct Taxes (Income Tax)",
    },
    {
      icon: postsGif,
      titleKey: "posts",
      originalTitle: "Posts",
    },
    {
      icon: telecommunicationsGif,
      titleKey: "telecommunications",
      originalTitle: "Telecommunications",
    },
    {
      icon: training,
      titleKey: "personnelTraining",
      originalTitle: "Personnel and Training",
    },
    {
      icon: housingUrbanAffairsGif,
      titleKey: "housingUrbanAffairs",
      originalTitle: "Housing and Urban Affairs",
    },
    {
      icon: healthWelfareGif,
      titleKey: "healthFamilyWelfare",
      originalTitle: "Health & Family Welfare",
    },
  ];

  return (
    <div className="bg-gray-200 p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl">
      <Toaster />
      
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center">
        {t("newGrievanceOrganisation")}
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Link
            to={`/grievance-form/${card.originalTitle}`}
            key={index}
            className="block"
          >
            <Card
              icon={card.icon}
              title={t(card.titleKey)}
              delay={index * 0.1}
            />
          </Link>
        ))}
      </div>

      {/* AI-Assisted Filing Button */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => setShowAIModal(true)}
          className="w-full max-w-2xl py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🤖</span>
          <span>{t("lodgeComplaintByAI")}</span>
          <span className="text-sm bg-white/20 px-2 py-1 rounded">{t("newBadge")}</span>
        </button>
      </div>
      
      <p className="text-sm text-center text-gray-600 mt-3">
        {t("aiDescribeIssue")}
      </p>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">🤖</span>
                {t("aiAssistedComplaintFiling")}
              </h2>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              {t("aiModalDescription")}
            </p>

            <div className="space-y-4">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={t("aiPlaceholder")}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="4"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAIFiling}
                  disabled={aiLoading}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                    aiLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  }`}
                >
                  {aiLoading ? t("processing") : t("fillFormWithAI")}
                </button>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                >
                  {t("cancel")}
                </button>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 {t("tip")}:</strong> {t("aiTip")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewGrievanceOrganisation;
