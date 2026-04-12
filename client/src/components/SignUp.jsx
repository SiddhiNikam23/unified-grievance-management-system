import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    address: "",
    state: "",
    city: "",
    phone: "",
    email: "",
    password: "",
    pincode: ""
  });
  const stateLists = {
    "choose": ["choose"],
    "Andhra Pradesh": ["choose", "Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Rajahmundry", "Kakinada", "Anantapur", "Nellore", "Kadapa", "Chittoor"],
    "Arunachal Pradesh": ["choose", "Itanagar", "Tawang", "Ziro", "Pasighat", "Bomdila", "Roing", "Tezu", "Along", "Seppa", "Changlang"],
    "Assam": ["choose", "Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur", "Tinsukia", "Nagaon", "Diphu", "Bongaigaon", "Sivasagar"],
    "Bihar": ["choose", "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Begusarai", "Purnia", "Samastipur", "Ara", "Chhapra"],
    "Chhattisgarh": ["choose", "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Jagdalpur", "Rajnandgaon", "Raigarh", "Ambikapur", "Dhamtari"],
    "Goa": ["choose", "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Calangute", "Bicholim", "Canacona", "Curchorem", "Sanguem"],
    "Gujarat": ["choose", "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Jamnagar", "Bhavnagar", "Anand", "Junagadh", "Bhuj"],
    "Haryana": ["choose", "Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak", "Hisar", "Yamunanagar", "Sonipat", "Panchkula"],
    "Himachal Pradesh": ["choose", "Shimla", "Manali", "Dharamshala", "Kullu", "Solan", "Mandi", "Chamba", "Bilaspur", "Hamirpur", "Una"],
    "Jharkhand": ["choose", "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Palamu", "Dumka"],
    "Karnataka": ["choose", "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Shivamogga", "Davanagere", "Ballari", "Tumakuru", "Udupi"],
    "Kerala": ["choose", "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Alappuzha", "Palakkad", "Kollam", "Kannur", "Kottayam", "Malappuram"],
    "Madhya Pradesh": ["choose", "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Ratlam", "Rewa", "Sagar", "Satna", "Chhindwara"],
    "Maharashtra": ["choose", "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai"],
    "Manipur": ["choose", "Imphal", "Bishnupur", "Thoubal", "Churachandpur", "Ukhrul", "Tamenglong", "Senapati", "Kakching", "Jiribam", "Moreh"],
    "Meghalaya": ["choose", "Shillong", "Tura", "Nongpoh", "Baghmara", "Jowai", "Williamnagar", "Resubelpara", "Mairang", "Nongstoin", "Khliehriat"],
    "Mizoram": ["choose", "Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Saiha", "Mamit", "Bairabi", "Saitual"],
    "Nagaland": ["choose", "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Mon", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng"],
    "Odisha": ["choose", "Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Berhampur", "Puri", "Balasore", "Bhadrak", "Angul", "Jeypore"],
    "Punjab": ["choose", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Ferozepur"],
    "Rajasthan": ["choose", "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Bharatpur", "Sikar", "Chittorgarh"],
    "Sikkim": ["choose", "Gangtok", "Namchi", "Mangan", "Gyalshing", "Pelling", "Rangpo", "Jorethang", "Ravangla", "Lachen", "Lachung"],
    "Tamil Nadu": ["choose", "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Vellore", "Tirunelveli", "Erode", "Thoothukudi", "Dindigul"],
    "Telangana": ["choose", "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Mahbubnagar", "Siddipet", "Ramagundam", "Mancherial", "Adilabad"],
    "Tripura": ["choose", "Agartala", "Udaipur", "Kailashahar", "Dharmanagar", "Ambassa", "Belonia", "Kamalpur", "Sonamura", "Khowai", "Bishalgarh"],
    "Uttar Pradesh": ["choose", "Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Meerut", "Ghaziabad", "Gorakhpur", "Bareilly", "Aligarh"],
    "Uttarakhand": ["choose", "Dehradun", "Haridwar", "Nainital", "Almora", "Rishikesh", "Mussoorie", "Pithoragarh", "Rudrapur", "Haldwani", "Tehri"],
    "West Bengal": ["choose", "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Kharagpur", "Bardhaman", "Midnapore", "Berhampore"],
    "Delhi": ["choose", "New Delhi", "Connaught Place", "Chandni Chowk", "Saket", "Karol Bagh", "Rohini", "Dwarka", "Lajpat Nagar", "Hauz Khas", "Janakpuri"]
  };
  const States = Object.keys(stateLists);
  const [selectedState, setSelectedState] = useState(States[0]);
  const [list, setList] = useState(stateLists[selectedState]);
  const handleStateChange = (event) => {
    const newState = event.target.value;
    setSelectedState(newState);
    setList(stateLists[newState]);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  async function handleSignup() {
    console.log(formData);
    const response = await fetch("http://localhost:5000/user/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (response.status === 200) {
      const data = await response.json();
      console.log(data);
      
      // Show custom success animation
      setShowSuccess(true);
      
      // Also show toast
      toast.success("Registration Successful! Please login.");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000); // Increased delay to show animation
    } else if (response.status === 400) {
      setStatus("User already exists");
      toast.error("User already exists with this email.");
    } else {
      toast.error("Registration failed. Please try again.");
    }
  }
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/login-bg.jpg')",
        backgroundSize: "130%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}>
      
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-full p-8 shadow-2xl animate-scaleIn">
            <svg className="w-24 h-24 text-green-500 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="animate-circle"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" className="animate-check"/>
            </svg>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes circle {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 100; }
        }
        @keyframes check {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 100; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-circle {
          stroke-dasharray: 0 100;
          animation: circle 0.6s ease-out 0.2s forwards;
        }
        .animate-check {
          stroke-dasharray: 0 100;
          animation: check 0.4s ease-out 0.6s forwards;
        }
      `}</style>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Registration / Sign-up Form
        </h2>
        <p className="text-gray-500 text-center mt-1">
          Fill in your details to create an account.
        </p>
        <form className="mt-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Gender *</label>
              <div className="flex space-x-4 mt-1">
                {["Male", "Female", "Transgender"].map((gender) => (
                  <label key={gender} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      onChange={handleChange}
                      className="text-indigo-500 focus:ring-indigo-400"
                    />
                    <span>{gender}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                pattern="[0-9]{6}"
                maxLength="6"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold text-gray-600">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">State *</label>
              <select
                name="state"
                value={formData.state}
                onChange={(e) => { handleChange(e); handleStateChange(e); }}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              >
                {States.map((state, index) => (
                  <option key={index} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">City *</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              >
                {list.map((item, index) => (
                  <option key={index} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Phone *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#ffb703] to-[#fb8500] text-white py-3 rounded-full font-semibold shadow-md mt-6 hover:shadow-lg transition-all duration-300"
            onClick={handleSignup}
          >
            Register ➜
          </button>
        </form>
      </div>
    </div>
  );
};
export default SignupForm;
