import { useState } from "react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
import { getCookie } from "../utilities/cookie";
import { FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
export default function Home({ showIntro = false }) {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const [grievances, setGrievances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
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
      cardClass: "bg-[#efe9f8] text-[#4a2d8f]",
      icon: FiAlertCircle,
    },
    {
      key: "pending",
      title: t("pendingGrievances"),
      value: pendingGrievances,
      cardClass: "bg-[#e5f6ec] text-[#1f7a47]",
      icon: FiClock,
    },
    {
      key: "closed",
      title: t("closedGrievances"),
      value: closedGrievances,
      cardClass: "bg-[#fae8e8] text-[#9b3a3a]",
      icon: FiCheckCircle,
    },
  ];

  const priorityBadge = (status) => {
    const colors = {
      "Complaint Filed": "bg-sky-100 text-sky-800",
      "Under Review": "bg-amber-100 text-amber-800",
      "Investigation": "bg-indigo-100 text-indigo-800",
      "Resolved": "bg-emerald-100 text-emerald-800",
      "Rejected": "bg-rose-100 text-rose-800",
      "Resolution Provided": "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const sourceBadge = (source) => {
    if (source === "twitter") {
      return <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">Web</span>;
    }
    if (source === "mobile") {
      return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Mobile</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">Web</span>;
  };
  useEffect(() => {
    const fetchUserAndGrievances = async () => {
      try {
        // First, get the current user to track who is logged in
        const userResponse = await fetch("http://localhost:5000/user/username", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (userResponse.status === 200) {
          const userData = await userResponse.json();
          console.log("Current user:", userData.email);

          // Only fetch grievances if user changed or first load
          if (!currentUser || currentUser !== userData.email) {
            setCurrentUser(userData.email);

            const response = await fetch("http://localhost:5000/grievance/", {
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

              console.log("Fetched grievances for user:", userData.email, sortedData);
              setGrievances(sortedData);
              setCurrentPage(1);
            } else if (response.status === 401) {
              console.log("Unauthorized - clearing grievances");
              setGrievances([]);
              setCurrentUser(null);
            }
          }
        } else {
          console.log("No user logged in");
          setGrievances([]);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setGrievances([]);
        setCurrentUser(null);
      }
    };

    fetchUserAndGrievances();

    // Set up an interval to check for user changes (in case of logout/login without navigation)
    const interval = setInterval(() => {
      const token = getCookie("token");
      if (!token && currentUser) {
        // User logged out
        setGrievances([]);
        setCurrentUser(null);
      } else if (token) {
        // Check if user changed
        fetchUserAndGrievances();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser]);
  return (
    <div className="space-y-6">
      {showIntro && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Citizen Workspace</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-900">Your grievance activity at a glance</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Monitor filing progress, review complaint history, and continue pending actions from one clean dashboard.
              </p>
            </div>
          </div>
        </section>
      )}

      <div id="dashboard-stats" className="grid grid-cols-1 gap-4 px-0 sm:grid-cols-3">
        {cardData.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 * index }}
            whileHover={{ y: -3 }}
            className={`cursor-pointer rounded-2xl border border-black/5 p-5 shadow-sm ${card.cardClass}`}
          >
            <div className="flex items-start justify-between">
              <p className="text-5xl font-bold leading-none">{card.value}</p>
              <div className="rounded-full bg-white/70 p-2">
                <card.icon className="text-lg" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] opacity-90">{card.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm" data-guide="high-risk">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{t("listOfGrievances")}</h2>
            <p className="text-sm text-slate-500">Recent complaints filed under your account</p>
          </div>
        </div>
        <div id="grievance-table" className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-slate-800">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">{t("serialNo")}</th>
                <th className="px-4 py-3 text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-sm font-semibold">{t("registrationNumber")}</th>
                <th className="px-4 py-3 text-sm font-semibold">{t("receivedDate")}</th>
                <th className="px-4 py-3 text-sm font-semibold">{t("grievanceDescription")}</th>
                <th className="px-4 py-3 text-sm font-semibold">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((grievance, index) => (
                <tr
                  key={grievance.id}
                  className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-teal-50 ${index % 2 === 0 ? "bg-slate-50/40" : "bg-white"
                    }`}
                  onClick={() => window.location.href = `/grievance/${grievance.grievanceCode}`}
                >
                  <td className="px-4 py-4 text-slate-700">{indexOfFirstEntry + index + 1}</td>
                  <td className="px-4 py-4">{sourceBadge(grievance.source)}</td>
                  <td className="px-4 py-4 font-semibold text-cyan-700">{grievance.grievanceCode}</td>
                  <td className="px-4 py-4 text-slate-600">{new Date(grievance.createdAt).toISOString().split("T")[0]}</td>
                  <td className="max-w-[280px] px-4 py-4 text-slate-600">
                    {(() => {
                      const words = grievance.description.split(" ");
                      return words.length > 3
                        ? words.slice(0, 3).join(" ") + "..."
                        : grievance.description;
                    })()}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge(grievance.currentStatus)}`}>
                      {grievance.currentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${currentPage === 1
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
          >
            {t("prev")}
          </button>
          <p className="text-sm font-medium text-slate-600">
            {t("pageOf").replace("{current}", currentPage).replace("{total}", Math.max(1, Math.ceil(grievances.length / entriesPerPage)))}
          </p>
          <button
            onClick={nextPage}
            disabled={currentPage === Math.ceil(grievances.length / entriesPerPage)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${currentPage === Math.ceil(grievances.length / entriesPerPage)
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}