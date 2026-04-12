import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
import axios from "axios";
import DuplicateWarning from "./DuplicateWarning";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
const GrievanceForm = ({ setActivePage }) => {
  const { department: departmentParam } = useParams();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const [department, setDepartment] = useState(departmentParam || "");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");
  const [remarksPlaceholder, setRemarksPlaceholder] = useState(""); 
  const [file, setFile] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); 
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [isAIFilling, setIsAIFilling] = useState(false); 
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateCheckData, setDuplicateCheckData] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const autofillData = localStorage.getItem('grievanceAutofill');
    if (autofillData) {
      setIsAIFilling(true); 
      try {
        const data = JSON.parse(autofillData);
        console.log("Autofill data from localStorage:", data);
        if (data.department) {
          console.log("Setting department to:", data.department);
          setDepartment(data.department);
        }
        setTimeout(() => {
          if (data.category) {
            console.log("Setting category to:", data.category);
            setCategory(data.category);
          }
        }, 100);
        setTimeout(() => {
          if (data.subcategory) {
            console.log("Setting subcategory to:", data.subcategory);
            setSubcategory(data.subcategory);
          }
        }, 200);
        setTimeout(() => {
          if (data.description) {
            console.log("Setting description to:", data.description);
            setDescription(data.description);
          }
          if (data.suggestedRemarks) {
            console.log("Setting remarks placeholder to:", data.suggestedRemarks);
            setRemarksPlaceholder(data.suggestedRemarks);
          }
          setTimeout(() => {
            setIsAIFilling(false);
          }, 100);
        }, 300);
        toast.success("Form auto-filled from chatbot! 🤖");
        localStorage.removeItem('grievanceAutofill');
      } catch (e) {
        console.error("Error parsing autofill data:", e);
        setIsAIFilling(false);
      }
    }
    setTimeout(() => {
      if (navigator.geolocation && !location) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span>📍 Allow location access for better complaint handling?</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  getLocation();
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Yes, Allow
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        ), {
          duration: 8000,
          position: 'top-center'
        });
      }
    }, 2000);
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (activeField === 'description') {
        setDescription(prev => prev + (prev ? ' ' : '') + transcript);
      } else if (activeField === 'remarks') {
        setRemarks(prev => prev + (prev ? ' ' : '') + transcript);
      }
      setIsListening(false);
      toast.success(t("speechRecognized"));
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      toast.error(t("speechError"));
    };
    recognition.onend = () => {
      setIsListening(false);
    };
  }
  const startListening = (field) => {
    if (!recognition) {
      toast.error(t("speechNotSupported"));
      return;
    }
    setActiveField(field);
    setIsListening(true);
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    recognition.start();
    toast.loading(t("listening"), { id: 'speech' });
  };
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      toast.dismiss('speech');
    }
  };
  const getPromptSuggestions = () => {
    const prompts = {
      public_services: [
        t("promptRationCard"),
        t("promptVoterID"),
        t("promptDrivingLicense"),
      ],
      infrastructure: [
        t("promptRoads"),
        t("promptStreetLights"),
        t("promptDrainage"),
      ],
      health_sanitation: [
        t("promptHospital"),
        t("promptWaste"),
        t("promptWater"),
      ],
      education: [
        t("promptSchool"),
        t("promptScholarship"),
        t("promptTeacher"),
      ],
      law_order: [
        t("promptPolice"),
        t("promptFIR"),
        t("promptSecurity"),
      ],
      revenue_taxation: [
        t("promptTax"),
        t("promptLand"),
        t("promptRefund"),
      ],
      employment: [
        t("promptJob"),
        t("promptSalary"),
        t("promptPension"),
      ],
      social_welfare: [
        t("promptDisability"),
        t("promptSenior"),
        t("promptWomen"),
      ],
      corruption: [
        t("promptBribery"),
        t("promptMisuse"),
        t("promptFraud"),
      ],
      documentation: [
        t("promptBirth"),
        t("promptDeath"),
        t("promptCaste"),
      ],
      utilities: [
        t("promptElectricity"),
        t("promptWaterSupply"),
        t("promptGas"),
      ],
    };
    return prompts[category] || [];
  };
  const handlePromptClick = (prompt) => {
    setDescription(prompt);
    toast.success(t("promptApplied"));
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); 
    if (e.target.files[0]) {
      toast.success(`File selected: ${e.target.files[0].name}`);
    }
  };
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Camera access denied. Please use file upload instead.');
    }
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], `complaint-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(file);
        toast.success('Photo captured successfully!');
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    toast.loading("Getting your location...", { id: "location" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        setLocation(locationData);
        setMapCenter([locationData.latitude, locationData.longitude]);
        setLocationStatus("success");
        setShowMap(false);
        toast.success("Location captured successfully!", { id: "location" });
      },
      (error) => {
        console.error("Location error:", error);
        let errorMessage = "Unable to get GPS location. Please use map to select.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable location permissions and try again.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable. Please use map to select.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again or use map.";
        }
        toast.error(errorMessage, { 
          id: "location",
          duration: 4000 
        });
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };
  const handleMapClick = (lat, lng) => {
    const locationData = {
      latitude: lat,
      longitude: lng,
      accuracy: 50,
      timestamp: new Date()
    };
    setLocation(locationData);
    setLocationStatus("success");
    toast.success("Location selected on map!", { id: "location" });
  };
  function LocationMarker() {
    useMapEvents({
      click(e) {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return location ? <Marker position={[location.latitude, location.longitude]} /> : null;
  }
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // Skip spam check - route doesn't exist
      const duplicateResponse = await fetch("http://localhost:5000/duplicate-detection/check", {
        method: "POST",
        body: JSON.stringify({
          description,
          location,
          department,
          category
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const duplicateResult = await duplicateResponse.json();
      if (duplicateResult.isDuplicate && duplicateResult.similarComplaints.length > 0) {
        setDuplicateCheckData(duplicateResult);
        setPendingSubmission({ department, category, subcategory, description, remarks });
        setShowDuplicateWarning(true);
        return; 
      }
      await submitGrievance();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error("An error occurred. Please try again.");
    }
  }
  async function submitGrievance(linkedTo = null) {
    try {
      let uploadedFileName = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedFileName = uploadResult.filename;
          toast.success("File uploaded successfully!");
        } else {
          toast.error("File upload failed");
          return;
        }
      }
      const response = await fetch("http://localhost:5000/grievance/", {
        method: "POST",
        body: JSON.stringify({
          department,
          category,
          subcategory,
          description,
          remarks,
          fileName: uploadedFileName,
          location: location,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (response.status === 201) {
        const result = await response.json();
        console.log("Grievance created:", result);
        if (linkedTo) {
          const linkResponse = await fetch("http://localhost:5000/duplicate-detection/link", {
            method: "POST",
            body: JSON.stringify({
              newGrievanceCode: result.grievanceCode,
              existingGrievanceCode: linkedTo.grievanceCode,
              similarityScore: linkedTo.similarityScore,
              reason: linkedTo.reason
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (linkResponse.ok) {
            toast.success("Grievance linked to existing complaint!");
          } else {
            console.error("Failed to link complaints");
            toast.success("Grievance submitted successfully!");
          }
        } else {
          toast.success("Grievance submitted successfully!");
        }
        setTimeout(() => {
          if (setActivePage) {
            setActivePage('home');
          } else {
            navigate("/homepage");
          }
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
        toast.error("Failed to submit grievance: " + (errorData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error in submitGrievance:", err);
      toast.error("Failed to submit grievance: " + err.message);
    }
  }
  const mainCategories = [
    { value: "public_services", label: t("publicServices") },
    { value: "infrastructure", label: t("infrastructure") },
    { value: "health_sanitation", label: t("healthSanitation") },
    { value: "education", label: t("education") },
    { value: "law_order", label: t("lawOrder") },
    { value: "revenue_taxation", label: t("revenueTaxation") },
    { value: "employment", label: t("employment") },
    { value: "social_welfare", label: t("socialWelfare") },
    { value: "corruption", label: t("corruption") },
    { value: "documentation", label: t("documentation") },
    { value: "utilities", label: t("utilities") },
    { value: "other", label: t("other") },
  ];
  const subcategories = {
    public_services: [
      { value: "ration_card", label: t("rationCard") },
      { value: "voter_id", label: t("voterID") },
      { value: "driving_license", label: t("drivingLicense") },
      { value: "passport", label: t("passport") },
    ],
    infrastructure: [
      { value: "roads", label: t("roads") },
      { value: "street_lights", label: t("streetLights") },
      { value: "drainage", label: t("drainage") },
      { value: "public_transport", label: t("publicTransport") },
    ],
    health_sanitation: [
      { value: "hospital_services", label: t("hospitalServices") },
      { value: "waste_management", label: t("wasteManagement") },
      { value: "water_quality", label: t("waterQuality") },
      { value: "public_toilets", label: t("publicToilets") },
    ],
    education: [
      { value: "school_admission", label: t("schoolAdmission") },
      { value: "scholarship", label: t("scholarship") },
      { value: "school_infrastructure", label: t("schoolInfrastructure") },
      { value: "teacher_absence", label: t("teacherAbsence") },
    ],
    law_order: [
      { value: "police_complaint", label: t("policeComplaint") },
      { value: "fir_delay", label: t("firDelay") },
      { value: "harassment", label: t("harassment") },
      { value: "security_issues", label: t("securityIssues") },
    ],
    revenue_taxation: [
      { value: "property_tax", label: t("propertyTax") },
      { value: "land_records", label: t("landRecords") },
      { value: "tax_refund", label: t("taxRefund") },
      { value: "assessment", label: t("assessment") },
    ],
    employment: [
      { value: "job_application", label: t("jobApplication") },
      { value: "salary_delay", label: t("salaryDelay") },
      { value: "pension", label: t("pension") },
      { value: "unemployment_benefits", label: t("unemploymentBenefits") },
    ],
    social_welfare: [
      { value: "disability_benefits", label: t("disabilityBenefits") },
      { value: "senior_citizen", label: t("seniorCitizen") },
      { value: "women_welfare", label: t("womenWelfare") },
      { value: "child_welfare", label: t("childWelfare") },
    ],
    corruption: [
      { value: "bribery", label: t("bribery") },
      { value: "misuse_of_power", label: t("misuseOfPower") },
      { value: "nepotism", label: t("nepotism") },
      { value: "fraud", label: t("fraud") },
    ],
    documentation: [
      { value: "birth_certificate", label: t("birthCertificate") },
      { value: "death_certificate", label: t("deathCertificate") },
      { value: "caste_certificate", label: t("casteCertificate") },
      { value: "income_certificate", label: t("incomeCertificate") },
    ],
    utilities: [
      { value: "electricity", label: t("electricity") },
      { value: "water_supply", label: t("waterSupply") },
      { value: "gas_connection", label: t("gasConnection") },
      { value: "internet", label: t("internet") },
    ],
    other: [
      { value: "feedback", label: t("feedback") },
      { value: "suggestion", label: t("suggestion") },
      { value: "general_query", label: t("generalQuery") },
    ],
  };
  const handleLinkToExisting = async (existingGrievanceCode, similarityScore, reason) => {
    setShowDuplicateWarning(false);
    await submitGrievance({ grievanceCode: existingGrievanceCode, similarityScore, reason });
  };
  const handleSubmitAnyway = async () => {
    setShowDuplicateWarning(false);
    await submitGrievance();
  };
  const handleCloseDuplicateWarning = () => {
    setShowDuplicateWarning(false);
    setPendingSubmission(null);
    setDuplicateCheckData(null);
  };
  return (
    <div className="min-h-screen flex">
      {}
      {showDuplicateWarning && duplicateCheckData && (
        <DuplicateWarning
          duplicateCheck={duplicateCheckData}
          onClose={handleCloseDuplicateWarning}
          onLinkToExisting={handleLinkToExisting}
          onSubmitAnyway={handleSubmitAnyway}
        />
      )}
      {}
      <Toaster />
      <div
        className="w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bgg.jpg')" }}
      ></div>
      {}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
        className="w-1/2 flex items-center justify-start p-12"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl p-6 bg-white shadow-2xl rounded-xl transition-all duration-300 ease-in-out"
          style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)" }}
        >
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            {t("submitYourGrievance")}
          </h1>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("departmentName")}
            </label>
            {departmentParam ? (
              <div className="bg-gray-200 border border-gray-300 rounded-lg px-4 py-3 text-gray-800">
                {department}
              </div>
            ) : (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  {t("selectDepartment")}
                </option>
                <option value="Financial Services (Banking Division)">{t("financialServices")}</option>
                <option value="Labour and Employment">{t("labourEmployment")}</option>
                <option value="Central Board of Direct Taxes (Income Tax)">{t("directTaxes")}</option>
                <option value="Posts">{t("posts")}</option>
                <option value="Telecommunications">{t("telecommunications")}</option>
                <option value="Personnel and Training">{t("personnelTraining")}</option>
                <option value="Housing and Urban Affairs">{t("housingUrbanAffairs")}</option>
                <option value="Health & Family Welfare">{t("healthFamilyWelfare")}</option>
              </select>
            )}
          </div>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("mainCategory")}
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (!isAIFilling) {
                  setSubcategory("");
                }
              }}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                {t("selectCategory")}
              </option>
              {mainCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("subcategory")}
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!category}
            >
              <option value="" disabled>
                {category ? t("selectSubcategory") : t("selectMainCategoryFirst")}
              </option>
              {category &&
                subcategories[category]?.map((subcat) => (
                  <option key={subcat.value} value={subcat.value}>
                    {subcat.label}
                  </option>
                ))}
            </select>
          </div>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("complaint")}
            </label>
            {}
            {category && getPromptSuggestions().length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 font-medium">{t("quickPrompts")}:</span>
                {getPromptSuggestions().map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {prompt.substring(0, 30)}...
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("describeIssue")}
                rows="4"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-14 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => isListening && activeField === 'description' ? stopListening() : startListening('description')}
                className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${
                  isListening && activeField === 'description'
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title={isListening && activeField === 'description' ? t("stopListening") : t("speechToText")}
              >
                {isListening && activeField === 'description' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("remarks")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={remarksPlaceholder || t("additionalRemarks")}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-14 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => isListening && activeField === 'remarks' ? stopListening() : startListening('remarks')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                  isListening && activeField === 'remarks'
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title={isListening && activeField === 'remarks' ? t("stopListening") : t("speechToText")}
              >
                {isListening && activeField === 'remarks' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {remarksPlaceholder && (
              <p className="text-xs text-blue-600 mt-1">
                💡 {t("aiSuggestion")}: {remarksPlaceholder}
              </p>
            )}
          </div>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("uploadDocument")}
            </label>
            <div className="space-y-3">
              {}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById('fileInput').click()}
                  className="flex-1 px-4 py-3 border-2 border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📁</span>
                  {t("chooseFile")}
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 px-4 py-3 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📷</span>
                  {t("takePhoto")}
                </button>
              </div>
              <input
                id="fileInput"
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="p-3 bg-green-50 border-l-4 border-green-600 rounded">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ File selected: {file.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t("acceptedFormats")}
            </p>
          </div>
          {}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {t("locationOptional")}
            </label>
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={getLocation}
                disabled={locationStatus === "loading"}
                className={`flex-1 px-4 py-3 border-2 font-medium transition-all duration-200 ${
                  locationStatus === "loading"
                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                    : location
                    ? "bg-green-50 border-green-600 text-green-700 hover:bg-green-100"
                    : "bg-white border-blue-600 text-blue-700 hover:bg-blue-50"
                }`}
              >
                <span className="text-xl mr-2">📍</span>
                {locationStatus === "loading" ? t("detecting") : location ? t("gpsCaptured") : t("useCurrentLocation")}
              </button>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`flex-1 px-4 py-3 border-2 font-medium transition-all duration-200 ${
                  showMap
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white border-gray-400 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl mr-2">🗺️</span>
                {showMap ? t("hideMap") : t("selectOnMap")}
              </button>
            </div>
            {location && (
              <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-600">
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-green-800 mb-1">{t("locationCaptured")}</p>
                  <p className="text-xs">Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}</p>
                  <p className="text-xs text-gray-500 mt-1">Accuracy: ±{Math.round(location.accuracy)}m</p>
                </div>
              </div>
            )}
            {showMap && (
              <div className="mb-3 border-2 border-gray-300 rounded overflow-hidden">
                <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">
                  {t("clickMapToSelect")}
                </div>
                <MapContainer
                  center={mapCenter}
                  zoom={location ? 15 : 5}
                  style={{ height: "400px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker />
                </MapContainer>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              {t("locationHelpsAuthorities")}
            </p>
          </div>
          {}
          <div className="flex justify-center">
            <button
              type="submit"
              className=" w-[23vw] bg-gradient-to-r from-[#ffb703] to-[#fb8500] text-white px-6 py-3 text-white py-3 rounded-full font-semibold shadow-md hover:shadow-lg hover:cursor-pointer transition-all duration-300"
            >
              {t("submitGrievance")}
            </button>
          </div>
        </form>
        {}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">📷</span>
                  Capture Photo
                </h2>
                <button
                  onClick={stopCamera}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-3">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all"
                  >
                    📸 Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Position the camera to clearly show the issue you're reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
export default GrievanceForm;
