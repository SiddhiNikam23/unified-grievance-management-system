import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useTour } from "../context/TourContext";
import { useAuth } from "../context/AuthContext"; // ✅ NEW

export default function LoginForm() {
  const [securityCode, setSecurityCode] = useState("");
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  // ✅ TOUR
  const { resumeAfterLogin, isPausedForAuth } = useTour();

  // ✅ AUTH CONTEXT
  const { login } = useAuth();

  async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // ✅ USE CONTEXT LOGIN
      const success = await login(email, password);

      if (success) {
        localStorage.setItem("showLoginToast", "true");

        // ✅ NAVIGATE (UNCHANGED)
        navigate("/homepage");

        // ✅ RESUME TOUR (UNCHANGED)
        if (isPausedForAuth) {
          setTimeout(() => {
            resumeAfterLogin();
          }, 500);
        }

      } else {
        setStatus("Invalid credentials or user not found");
      }

    } catch (error) {
      console.error("Login error:", error);
      setStatus("Connection error. Please check if backend is running.");
    }
  }

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/login-bg.jpg')",
        backgroundSize: "120%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-xl w-full max-w-md sm:max-w-lg min-h-[560px] flex flex-col justify-center">

        <h2 className="text-2xl font-bold text-center text-gray-800">User Login</h2>
        <p className="text-gray-500 text-center mt-1">
          Welcome back! Please enter your credentials.
        </p>

        <div className="mt-6">
          <label className="text-sm font-semibold text-gray-600">Email / Mobile No</label>
          <div className="flex items-center border rounded-lg p-2 mt-1 bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-400">
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter your details"
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-600">Password</label>
          <div className="flex items-center border rounded-lg p-2 mt-1 bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-400">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>

        {status && (
          <p className="text-red-600 text-sm mt-2 text-center">{status}</p>
        )}

        <button
          className="w-full bg-gradient-to-r from-[#ffb703] to-[#fb8500] text-white py-3 rounded-full font-semibold shadow-md mt-6 hover:shadow-lg transition-all duration-300"
          onClick={handleLogin}
        >
          Login ➜
        </button>

        <ToastContainer />

        <div className="text-center mt-4 text-sm text-gray-600">
          <a href="#" className="hover:text-indigo-700 transition">
            Forgot Password
          </a> |
          <a href="#" className="hover:text-indigo-700 ml-2 transition">
            Forgot Username
          </a>
          <br />
          <a href="/signup" className="hover:text-indigo-700 font-medium transition">
            Click here to Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}