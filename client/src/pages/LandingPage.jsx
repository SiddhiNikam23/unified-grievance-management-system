import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Features from "../components/Features";
import Services from "../components/Services";
import OnlineServices from "../components/OnlineServices";
import HeroSection from "../components/HeroSection";
import Tour from "../components/Tour"; // ✅ ADD THIS
import { toast, ToastContainer } from "react-toastify";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const showToast = localStorage.getItem("showLoginToast");
    if (showToast === "true") {
      toast.success("Signed Out Successfully!", {
        position: "top-center",
        autoClose: 3000,
      });

      setTimeout(() => {
        localStorage.removeItem("showLoginToast");
      }, 3000);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "auto";
    };
  }, []);

  const handleNavigate = async () => {
    navigate("/login");
  };

  return (
    <div className="overflow-x-hidden w-full">
      <ToastContainer autoClose={3000} position="top-center" />


      {/* ✅ Tour Component */}
      <Tour type="landing" />

      {/* Existing UI */}
      <HeroSection />
      <Features />
      <Services />
      <OnlineServices />
      <Footer />
    </div>
  );
};

export default LandingPage;