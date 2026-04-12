import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const FAQPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [openQuestion, setOpenQuestion] = useState(null);
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const faqs = {
    general: [
      {
        question: t("faqQ1"),
        answer: t("faqA1"),
      },
      {
        question: t("faqQ2"),
        answer: t("faqA2"),
      },
    ],
    submission: [
      {
        question: t("faqQ3"),
        answer: t("faqA3"),
      },
      {
        question: t("faqQ4"),
        answer: t("faqA4"),
      },
    ],
    tracking: [
      {
        question: t("faqQ5"),
        answer: t("faqA5"),
      },
      {
        question: t("faqQ6"),
        answer: t("faqA6"),
      },
    ],
    redressal: [
      {
        question: t("faqQ7"),
        answer: t("faqA7"),
      },
      {
        question: t("faqQ8"),
        answer: t("faqA8"),
      },
      {
        question: t("faqQ9"),
        answer: t("faqA9"),
      },
      {
        question: t("faqQ10"),
        answer: t("faqA10"),
      },
    ],
    rolesAndTimeframes: [
      {
        question: t("faqQ11"),
        answer: t("faqA11"),
      },
      {
        question: t("faqQ12"),
        answer: t("faqA12"),
      },
      {
        question: t("faqQ13"),
        answer: t("faqA13"),
      },
    ],
    escalation: [
      {
        question: t("faqQ14"),
        answer: t("faqA14"),
      },
      {
        question: t("faqQ15"),
        answer: t("faqA15"),
      },
    ],
  };
  const renderFAQ = (category) =>
    faqs[category].map((faq, index) => (
      <div
        key={index}
        className="mb-4 bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
      >
        <button
          onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
          className={`w-full text-left text-gray-800 text-lg font-semibold flex justify-between items-center px-6 py-4 hover:bg-indigo-50 transition-colors ${
            openQuestion === index ? "bg-indigo-50" : "bg-white"
          }`}
        >
          {faq.question}
          <span
            className={`ml-4 transform transition-transform duration-300 ${
              openQuestion === index ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </button>
        <div
          style={{
            height: openQuestion === index ? "auto" : 0,
            overflow: "hidden",
          }}
          className={`px-6 bg-indigo-50 text-gray-700 text-base transition-all duration-300 ${
            openQuestion === index
              ? "py-4 opacity-100 scale-y-100"
              : "py-0 opacity-0 scale-y-0"
          } transform origin-top`}
        >
          {faq.answer}
        </div>
      </div>
    ));
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8">
        {}
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-4">
          {t("faqTitle")}
        </h1>
        <p className="text-gray-600 text-lg text-center mb-8 max-w-2xl mx-auto">
          {t("faqSubtitle")}
        </p>
        {}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {Object.keys(faqs).map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-6 py-2 rounded-full text-lg font-medium transition-all duration-300 border-2 ${
                activeTab === category
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-white border-gray-300 text-gray-800 hover:bg-indigo-50"
              }`}
            >
              {t(`faq${category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, "$1")}`)}
            </button>
          ))}
        </div>
        {}
        <div>{renderFAQ(activeTab)}</div>
      </div>
    </div>
  );
};
export default FAQPage;
