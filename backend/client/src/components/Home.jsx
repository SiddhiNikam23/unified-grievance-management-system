import { useState } from "react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
export default function Home() {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const [grievances, setGrievances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = grievances.slice(indexOfFirstEntry, indexOfLastEntry);
  const nextPage = () => {
    if (currentPage < Math.ceil(grievances.length / entriesPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const totalGrievances = grievances.length;
  const pendingGrievances = grievances.filter((g) => (g.currentStatus !== "Resolution Provided" && g.currentStatus !== "Rejected")).length;
  const closedGrievances = totalGrievances - pendingGrievances;
  const cardData = [
    {
      key: "total",
      title: t("totalGrievances"),
      value: totalGrievances,
      gradientClass: "from-indigo-500 to-indigo-600",
    },
    {
      key: "pending",
      title: t("pendingGrievances"),
      value: pendingGrievances,
      gradientClass: "from-green-500 to-green-600",
    },
    {
      key: "closed",
      title: t("closedGrievances"),
      value: closedGrievances,
      gradientClass: "from-red-500 to-red-600",
    },
  ];
  useEffect(() => {
    const fetchGrievances = async () => {
      const response = await fetch("http://localhost:5000/grievance/allGrievances", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (response.status === 200) {
        const data = await response.json();
        
        // Sort: Move resolved/resolution provided to bottom
        const sortedData = data.sort((a, b) => {
          const aResolved = a.currentStatus === 'Resolved' || a.currentStatus === 'Resolution Provided';
          const bResolved = b.currentStatus === 'Resolved' || b.currentStatus === 'Resolution Provided';
          
          if (aResolved && !bResolved) return 1;
          if (!aResolved && bResolved) return -1;
          return 0;
        });
        
        console.log(sortedData);
        setGrievances(sortedData);
      }
    };
    fetchGrievances();
  }, []);
  return (
    <div className="min-h-screen bg-gray-100">
      {}
      <div className="mt-10 mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-5 px-5">
        {cardData.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 * index }}
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-r ${card.gradientClass} text-white p-6 rounded-xl shadow-xl cursor-pointer`}
          >
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="mt-2">{card.title}</p>
          </motion.div>
        ))}
      </div>
      {}
      <div className="mt-10 mx-auto max-w-6xl bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6">{t("listOfGrievances")}</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3">{t("serialNo")}</th>
                <th className="p-3">{t("registrationNumber")}</th>
                <th className="p-3">{t("receivedDate")}</th>
                <th className="p-3">{t("grievanceDescription")}</th>
                <th className="p-3">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((grievance, index) => (
                <tr
                  key={grievance.id}
                  className={`border-b last:border-b-0 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50 cursor-pointer transition-colors`}
                  onClick={() => window.location.href = `/grievance/${grievance.grievanceCode}`}
                >
                  <td className="p-3">{indexOfFirstEntry + index + 1}</td>
                  <td className="p-3 text-blue-600 font-semibold">{grievance.grievanceCode}</td>
                  <td className="p-3">{new Date(grievance.createdAt
                  ).toISOString().split("T")[0]}</td>
                  <td className="p-3">
                    {(() => {
                      const words = grievance.description.split(" ");
                      return words.length > 3
                        ? words.slice(0, 3).join(" ") + "..."
                        : grievance.description;
                    })()}
                  </td>
                  <td className="p-3 font-semibold">{grievance.currentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {}
        <div className="mt-5 flex justify-between items-center">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentPage === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {t("prev")}
          </button>
          <p className="text-gray-700">
            {t("pageOf").replace("{current}", currentPage).replace("{total}", Math.max(1, Math.ceil(grievances.length / entriesPerPage)))}
          </p>
          <button
            onClick={nextPage}
            disabled={currentPage === Math.ceil(grievances.length / entriesPerPage)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentPage === Math.ceil(grievances.length / entriesPerPage)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
