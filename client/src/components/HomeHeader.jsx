import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";

function HomeHeader() {
  const [serviceQuery, setServiceQuery] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const handleServiceSearch = (event) => {
    event.preventDefault();
    const query = serviceQuery.trim();
    if (!query) return;
    navigate(`/complaints?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
      <div>
        <div className="mb-6 rounded-3xl border border-slate-200 bg-[#f5f7fb] px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="max-w-[620px] text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                GrievanceHub: The Seamless Search Seamless Voice of Citizens
              </h1>

              <form onSubmit={handleServiceSearch} className="mt-8">
                <div className="flex w-full max-w-[520px] items-center rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
                  <input
                    type="text"
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    placeholder="Search services"
                    className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2f8db5] text-white transition hover:bg-[#267b9f]"
                    aria-label="Search services"
                  >
                    <FiSearch className="text-lg" />
                  </button>
                </div>
              </form>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -left-6 bottom-2 h-28 w-28 rounded-full bg-[#dfeaf8]" />
              <img
                src="/images/bg10.png"
                alt="Complaint resolution"
                className="relative z-10 w-full max-w-[500px] rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Citizen Dashboard</p>
        <h1 className="mt-2 text-[44px] font-bold leading-tight text-slate-900 sm:text-[52px]">{t("welcomeTitle")}</h1>
        <p className="mt-2 max-w-3xl text-[18px] text-slate-600">{t("welcomeSubtitle")}</p>
      </div>
    </header>
  )
}

export default HomeHeader
