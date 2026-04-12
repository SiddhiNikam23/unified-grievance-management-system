import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Clients from "./pages/Clients";
import Quotes from "./pages/Quotes";
import GrievanceDetail from "./pages/GrievanceDetail";
import Billing from "./pages/Billing";
import Login from "./components/login";
import EmergencyResponse from "./pages/EmergencyResponse";
import AIPDFAnalyzer from "./components/AIPDFAnalyzer";
import SocialComplaints from "./pages/SocialComplaints";
const Layout = ({ children }) => (
    <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
            <Header />
            <div className="p-6">{children}</div>
        </div>
    </div>
);
const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        };
        const token = getCookie('adminToken');
        setIsAuthenticated(!!token);
        setIsLoading(false);
    }, []);
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};
function App() {
    return (
        <Router>
            <Routes>
                {}
                <Route path="/" element={<Navigate to="/login" />} />
                {}
                <Route path="/login" element={<Login />} />
                {}
                <Route 
                    path="/clients" 
                    element={
                        <ProtectedRoute>
                            <Layout><Clients /></Layout>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/emergency" 
                    element={
                        <ProtectedRoute>
                            <Layout><EmergencyResponse /></Layout>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/social-complaints" 
                    element={
                        <ProtectedRoute>
                            <Layout><SocialComplaints /></Layout>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/quotes" 
                    element={
                        <ProtectedRoute>
                            <Layout><Quotes /></Layout>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/billing" 
                    element={
                        <ProtectedRoute>
                            <Layout><Billing /></Layout>
                        </ProtectedRoute>
                    } 
                />
                {}
                <Route 
                    path="/grievance/:grievanceCode" 
                    element={
                        <ProtectedRoute>
                            <Layout><GrievanceDetail /></Layout>
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}
export default App;
