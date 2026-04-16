import React, { useState, useEffect } from 'react';
import { FiMenu, FiX, FiGrid, FiBell, FiMessageCircle, FiPlus, FiSearch, FiActivity, FiGlobe, FiLogOut } from "react-icons/fi";
import Footer from "../components/Footer";
import HomeHeader from "../components/HomeHeader";
import Home from "../components/Home";
import Status from "../components/Status";
import Contact from "../components/Contact";
import NewGrievanceOrganisation from "../components/NewGrievanceOrganisation";
import ProfilePage from "../components/ProfilePage";
import SignUp from "../components/SignUp";
import GrievanceForm from "../components/GrievanceForm";
import LoginForm from "../components/login";
import FAQPage from "../components/FAQPage";
import ChangePassword from "../components/ChangePassword";
import AccountDetails from "../components/AccountDetails";
import Chatbot from "../components/Chatbot";
import { useNavigate } from 'react-router';
import { deleteCookie, getCookie } from "../utilities/cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTour } from "../context/TourContext";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
import { useAuth } from "../context/AuthContext"; // ✅ Added AuthContext

function Sidebar({ setActivePage, activePage }) {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" }
  ];
  const { logout: globalLogout } = useAuth(); // ✅ Use global logout

  function handleLogout() {
    globalLogout()
      .then(() => {
        localStorage.setItem("showLoginToast", "true");
        navigate("/");
      })
      .catch(err => console.error("Logout error", err));
  }
  const items = [
    { key: "home", id: "sidebar-home", text: t("appealDashboard"), icon: FiGrid },
    { key: "contact", id: "sidebar-contact", text: "Post-events", icon: FiBell },
    { key: "chatbot", id: "sidebar-chatbot", text: t("chatbot"), icon: FiMessageCircle },
    { key: "Submit", id: "sidebar-Submit", text: "Appeal Dashboard", icon: FiGrid },
    { key: "newGrievanceOrganisation", id: "sidebar-newGrievanceOrganisation", text: t("lodgeGrievance"), icon: FiPlus },
    { key: "status", id: "sidebar-status", text: t("checkStatus"), icon: FiSearch },
    { key: "accountDetails", id: "sidebar-accountDetails", text: t("accountActivity"), icon: FiActivity },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-b from-[#0f4a66] via-[#0d5970] to-[#0c344c] p-5 text-white">
      <div className="mb-6 px-1">
        <h2 className="text-[34px] font-bold tracking-tight">NagrikConnect AI</h2>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <SidebarItem
            key={`${item.key}-${item.text}`}
            id={item.id}
            icon={item.icon}
            text={item.text}
            isActive={activePage === item.key}
            onClick={() => setActivePage(item.key)}
          />
        ))}
        {/* ... rest of the sidebar ... */}

        <li className="mt-8 border-t border-white/20 pt-6">
          <div className="mb-3 flex items-center gap-2 text-base font-semibold">
            <FiGlobe className="text-lg" />
            <span>Language / भाषा</span>
          </div>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-white/30 bg-white/10 px-3 py-3 text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </li>

        <SidebarItem
          icon={FiLogOut}
          text={t("signOut")}
          special
          onClick={handleLogout}
        />

        <li className="mt-4 border-t border-white/10 pt-4">
          <button
            onClick={() => {
              localStorage.removeItem("nagrik_dash_tour_completed");
              window.location.reload();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-cyan-200/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FiActivity className="text-lg" />
            <span>Re-run Guided Tour</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
function SidebarItem({ id, icon: Icon, text, special, isActive, onClick }) {
  return (
    <li
      id={id}
      onClick={onClick}
      className={`group flex cursor-pointer items-center rounded-2xl px-4 py-3 text-base transition-all duration-200 ${special
          ? "mt-4 border border-rose-300/30 bg-rose-500/90 text-white hover:bg-rose-500"
          : isActive
            ? "bg-[#5aaeff]/70 text-white shadow-[0_0_28px_rgba(90,174,255,0.82)]"
            : "text-cyan-100/95 hover:bg-white/10 hover:text-white"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`text-[18px] ${isActive ? "text-white" : "text-cyan-100"}`} />
        <span className="font-semibold tracking-tight">{text}</span>
      </div>
    </li>
  );
}
function HomePage() {
  const { startDashboardTour, isTourActive } = useTour();
  
  useEffect(() => {
    const showToast = localStorage.getItem("showLoginToast");
    const profileUpdateToast = localStorage.getItem("showProfileUpdateToast");
    if (showToast === "true") {
      toast.success("Welcome back!", { position: "top-center", autoClose: 3000 });
      setTimeout(() => {
        localStorage.removeItem("showLoginToast");
      }, 3000);
    }
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  
  // ✅ Get Auth state from context
  const { isAuthenticated, user, isLoading, startTour } = useAuth();
  const navigate = useNavigate();

  // DASHBOARD TOUR TRIGGER (PRESERVED LOGIC)
  useEffect(() => {
    if (user?.email) {
      console.log("User detected in dashboard:", user.email);
      
      const hasSeenDashTour = localStorage.getItem("nagrik_dash_tour_completed");
      if (!hasSeenDashTour && !isTourActive) {
          // Wait a moment for dashboard components to mount
          setTimeout(() => {
              startDashboardTour();
          }, 1000);
      }
    }
  }, [user, isTourActive, startDashboardTour]);
  const renderContent = () => {
    if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-700">You are not logged in</h1>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition duration-200"
          >
            Login
          </button>
        </div>
      );
    }
    switch (activePage) {
      case "home":
      case "home":
        return <Home key={user?.email} />;
      case "Submit":
        return <Complaints />;
      case "status":
        return <Status />;
      case "contact":
        return <Contact />;
      case "newGrievanceOrganisation":
        return <NewGrievanceOrganisation setActivePage={setActivePage} />;
      case "profile":
        return <ProfilePage setActivePage={setActivePage} />;
      case "signUp":
        return <SignUp />;
      case "grievanceForm":
        return <GrievanceForm setActivePage={setActivePage} />;
      case "login":
        return <LoginForm />;
      case "faq":
        return <FAQPage />;
      case "changePassword":
        return <ChangePassword />;
      case "accountDetails":
        return <AccountDetails />;
      case "chatbot":
        return <Chatbot setActivePage={setActivePage} />;
      default:
        return <Home key={user?.email} />;
    }
  };
  return (
    <div className="min-h-screen bg-[#ece9e4] p-1 sm:p-2 lg:p-3">
      <ToastContainer autoClose={3000} position="top-center" />

      <div className="mx-auto min-h-[calc(100vh-8px)] w-[calc(100vw-8px)] max-w-none overflow-hidden rounded-[30px] border border-black/5 bg-[#f7f8fb] shadow-[0_24px_42px_rgba(15,23,42,0.16)] sm:min-h-[calc(100vh-16px)] sm:w-[calc(100vw-16px)] lg:h-[calc(100vh-24px)] lg:w-[calc(100vw-24px)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Citizen Portal</p>
            <p className="text-sm font-semibold text-slate-900">Dashboard</p>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-2xl focus:outline-none">
            <FiMenu />
          </button>
        </div>

        {isAuthenticated && (
          <div className={`flex flex-1 flex-col lg:flex-row h-full ${isTourActive ? "overflow-visible" : "overflow-hidden"}`}>
            <aside className={`hidden lg:block lg:min-h-[calc(100vh-48px)] lg:w-[280px] xl:w-[300px] ${isTourActive ? "overflow-visible z-[2002]" : "overflow-hidden"}`}>
              <Sidebar setActivePage={setActivePage} activePage={activePage} />
            </aside>
            {isSidebarOpen && (
              <div className="fixed inset-0 z-50 flex bg-black/50">
                <div className={`flex h-full w-80 flex-col shadow-md ${isTourActive ? "overflow-visible" : "overflow-hidden"}`}>
                  <div className="bg-[#0f5167] p-2">
                    <button onClick={() => setIsSidebarOpen(false)} className="self-end p-3 text-xl text-white">
                      <FiX />
                    </button>
                  </div>
                  <Sidebar setActivePage={setActivePage} activePage={activePage} />
                </div>
                <div className="flex-grow" onClick={() => setIsSidebarOpen(false)}></div>
              </div>
            )}
            <main id="dashboard-welcome" className="flex-1 bg-[#f3f5fa] p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <HomeHeader />
              <div className="mt-6">{renderContent()}</div>
            </main>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-[#f3f5fa] p-4">
            {activePage === "home" && <HomeHeader />}
            <div className="mt-6">{renderContent()}</div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
export default HomePage;