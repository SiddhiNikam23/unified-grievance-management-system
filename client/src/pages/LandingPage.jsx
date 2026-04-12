import { useEffect } from "react";
import HeroSection from "../components/HeroSection";
import { toast, ToastContainer } from "react-toastify";
const LandingPage = () => {
    useEffect(() => {
      const showToast = localStorage.getItem("showLoginToast"); 
      console.log("🚀 Checking Local Storage:", showToast); 
      if (showToast === "true") {
        console.log("🚀 Showing toast");
          toast.success("Signed Out Successfully!", { position: "top-center", autoClose: 3000 }); 
          setTimeout(() => {
            localStorage.removeItem("showLoginToast");
          }
          , 3000);
      }
  }, []);
  useEffect(() => {
    document.body.style.overflowX = "hidden"; 
    return () => {
      document.body.style.overflowX = "auto"; 
    };
  }, []);
  return (
    <div className="overflow-x-hidden w-full">
      <ToastContainer autoClose={3000} position="top-center" />
      <HeroSection />
    </div>
  );
};
export default LandingPage;
