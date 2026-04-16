import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const images = [
    "/images/bg4.jpg",
    "/images/bg5.jpg",
    "/images/bg6.jpg",
    "/images/bg7.jpg",
  ];
const HeroSection = () => {
    const [index, setIndex] = useState(0);
    const { language } = useLanguage();
    const t = (key) => getTranslation(language, key);
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); 
        return () => clearInterval(interval);
    }, []);
    return (
        <section id="tour-hero" className="relative h-115 flex items-center justify-center text-white overflow-hidden">
            {}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <AnimatePresence>
                    <motion.div
                        key={index}
                        initial={{ x: "100%" }}
                        animate={{ x: "0%" }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${images[index]})` }}
                    />
                </AnimatePresence>
            </div>
            {}
            <div className="relative w-full h-screen flex items-center justify-center">
                {}
                <div className="absolute  w-full h-screen inset-0 bg-black opacity-50"></div>
                {}
                <motion.div
                    initial={{ opacity: 0, y: 250 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.8, ease: "easeOut" }} 
                    className="relative z-10 text-center px-4"
                >
                    <h1 className="text-5xl font-bold">
                        {t("heroTitle")}
                    </h1>
                    <p className="mt-4 text-lg">
                        {t("heroSubtitle")}
                    </p>
                    
                    {/* Permanent Tour Trigger */}
                    <div className="mt-8">
                        <button
                            onClick={() => {
                                localStorage.removeItem("nagrik_tour_completed");
                                window.location.reload();
                            }}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg flex items-center gap-2 mx-auto"
                        >
                            <span className="text-teal-400">✧</span>
                            Take the Guided Tour
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
export default HeroSection