import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";

const OnlineServices = () => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const onlineServices = [
    { title: t("submitFeedback"), description: t("submitFeedbackDesc") },
    { title: t("accessKnowledgeBase"), description: t("accessKnowledgeBaseDesc") },
    { title: t("appealDecision"), description: t("appealDecisionDesc") },
    { title: t("govtSchemes"), description: t("govtSchemesDesc") },
    { title: t("publicServiceIssues"), description: t("publicServiceIssuesDesc") },
    { title: t("legalAdminConcerns"), description: t("legalAdminConcernsDesc") },
  ];

  return (
    // ✅ ID ADDED HERE
    <section id="online-services" className="py-20 px-6 md:px-20 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-12">
        {t("exploreOnlineServices")}
      </h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {onlineServices.map((item, idx) => {
          const variant =
            idx < 3
              ? {
                  hidden: { opacity: 0, x: "-100vw" },
                  visible: { opacity: 1, x: 0, transition: { duration: 1 } },
                }
              : {
                  hidden: { opacity: 0, x: "100vw" },
                  visible: { opacity: 1, x: 0, transition: { duration: 1 } },
                };

          return (
            <motion.div
              key={idx}
              className="relative bg-white p-8 rounded-2xl shadow-lg transition transform hover:-translate-y-3 hover:shadow-2xl overflow-hidden"
              variants={variant}
            >
              <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-lg transition-opacity opacity-0 hover:opacity-20"></div>

              <div className="mb-4 w-16 h-16 mx-auto flex items-center justify-center bg-blue-100 text-blue-500 rounded-full shadow-md">
                🛠️
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {item.title}
              </h3>

              <p className="text-gray-500 text-sm">{item.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

    </section>
  );
};

export default OnlineServices;