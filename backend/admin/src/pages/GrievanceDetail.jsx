import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AIPDFAnalyzer from "../components/AIPDFAnalyzer";
import AIResolutionGenerator from "../components/AIResolutionGenerator";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";
function GrievanceDetail() {
    const { grievanceCode } = useParams();
    const [grievance, setGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStage, setCurrentStage] = useState("Complaint Filed");
    const [currentStatus, setCurrentStatus] = useState("Complaint Filed");
    const [showPopup, setShowPopup] = useState(false); 
    const [showConfetti, setShowConfetti] = useState(false); 
    const [questionToClient, setQuestionToClient] = useState(""); 
    const [sendingQuestion, setSendingQuestion] = useState(false); 
    const navigate = useNavigate();
    useEffect(() => {
        const fetchGrievance = async () => {
            try {
                const response = await fetch(`http://localhost:5000/grievance/grievanceCode/${grievanceCode}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setGrievance(data);
                    setCurrentStage(data.currentStage || "Complaint Filed");
                    setCurrentStage(data.currentStatus || "Complaint Filed");
                } else {
                    console.error("Error fetching grievance:", response.statusText);
                }
            } catch (error) {
                console.error("Network error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGrievance();
    }, [grievanceCode]);
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }
    if (!grievance) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
                ❌ No grievance found. Please check the reference ID.
            </div>
        );
    }
    const stageColors = {
        "Complaint Filed": {
            default: "bg-green-100 text-green-700 hover:bg-green-200",
            active: "bg-green-500 text-white",
        },
        "Under Review": {
            default: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
            active: "bg-yellow-500 text-white",
        },
        "Investigation": {
            default: "bg-blue-100 text-blue-700 hover:bg-blue-200",
            active: "bg-blue-500 text-white",
        },
        "Resolution Provided": {
            default: "bg-gray-300 text-gray-800 hover:bg-gray-400",
            active: "bg-gray-700 text-white",
        }
    };
    const stages = [
        "Complaint Filed",
        "Under Review",
        "Investigation",
        "Resolution Provided"
    ];
    const showFile = async () => {
        if (!grievance.fileName) {
            alert("❌ No file uploaded for this grievance.");
            return;
        }
        try {
            const fileUrl = `http://localhost:5000/file/${grievance.fileName}`;
            window.open(fileUrl, "_blank"); 
        } catch (error) {
            console.error("❌ Error opening file:", error);
            alert("❌ Failed to open file.");
        }
    };
    const aiResolvedTick = async () => {
        setCurrentStage("Resolution Provided");
        setCurrentStatus("Resolution Provided");
        console.log("currentStage", currentStage);
        try {
            const response = await fetch(`http://localhost:5000/grievance/grievanceCode/${grievanceCode}/ai-resolve`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentStatus: "Resolution Provided",
                    aiResolved: true,
                }),
            });
            if (response.ok) {
                alert("✅ AI Assistance flag updated successfully!");
                setGrievance({...grievance, aiResolved: true, currentStatus: "Resolution Provided"});
                setTimeout(() => {
                    navigate("/clients");
                }, 1000);
            } else {
                alert("❌ Failed to update AI flag.");
            }
        }
        catch (error) {
            console.error("❌ Error updating AI flag:", error);
            alert("❌ Failed to update AI flag.");
        }
    };
    const handleResolutionGenerated = (resolutionData) => {
        setGrievance({
            ...grievance,
            aiResolved: true,
            currentStatus: "Resolution Provided",
            aiResolutionText: resolutionData.resolution,
            aiResolutionPDF: resolutionData.pdfFileName
        });
        setCurrentStage("Resolution Provided");
        setCurrentStatus("Resolution Provided");
        setShowPopup(true);
        setShowConfetti(true);
        setTimeout(() => {
            setShowPopup(false);
            setShowConfetti(false);
        }, 3000);
        setTimeout(() => {
            navigate("/clients");
        }, 4000);
    };
    const handleStageClick = async(stage) => {
        setCurrentStage(stage);
        const response = await fetch(`http://localhost:5000/grievance/grievanceCode/${grievanceCode}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentStatus: stage,
            }),
        });
        if (stage === "Resolution Provided") {
            setShowPopup(true);
            setShowConfetti(true);
            setTimeout(() => {
                setShowPopup(false);
                setShowConfetti(false);
            }, 3000);
            setTimeout(() => {
                navigate("/clients");
            }, 4000);
        }
    };
    const sendQuestionToClient = async () => {
        if (!questionToClient.trim()) {
            alert("⚠️ Please enter a question or message!");
            return;
        }
        setSendingQuestion(true);
        try {
            const adminEmail = localStorage.getItem('adminEmail') || 'admin@maharashtragovt.com';
            const response = await fetch(`http://localhost:5000/grievance/grievanceCode/${grievanceCode}/question`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    question: questionToClient,
                    askedBy: adminEmail
                })
            });
            if (response.ok) {
                alert(`✅ Question sent to ${grievance.complainantName}\n\nThe client will see this question when they login to their account.`);
                setQuestionToClient(""); 
                const updatedResponse = await fetch(`http://localhost:5000/grievance/grievanceCode/${grievanceCode}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                if (updatedResponse.ok) {
                    const updatedData = await updatedResponse.json();
                    setGrievance(updatedData);
                }
            } else {
                alert("❌ Failed to send question. Please try again.");
            }
        } catch (error) {
            console.error("Error sending question:", error);
            alert("❌ Failed to send question. Please try again.");
        } finally {
            setSendingQuestion(false);
        }
    };
    return (
        <div className="w-full mx-auto mt-10 p-8 bg-white shadow-lg rounded-3xl border border-gray-200">
            {}
            {grievance.isEscalated && (
                <div className="mb-6 p-5 bg-red-100 border-l-4 border-red-600 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">🚨</span>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-red-900">ESCALATED COMPLAINT</h3>
                            <p className="text-sm text-red-700 mt-1">
                                This complaint has been escalated and requires immediate attention
                            </p>
                            {grievance.escalationReason && (
                                <p className="text-sm text-red-800 mt-2 font-semibold">
                                    Reason: {grievance.escalationReason}
                                </p>
                            )}
                            {grievance.escalatedAt && (
                                <p className="text-xs text-red-600 mt-1">
                                    Escalated on: {new Date(grievance.escalatedAt).toLocaleString('en-IN')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {}
            {showConfetti && (
                <div className="fixed inset-0 z-50 pointer-events-none">
                    <Confetti numberOfPieces={600} recycle={false} />
                </div>
            )}
            {}
            {showPopup && <div className="fixed inset-0 bg-black opacity-50 z-40"></div>}
            {}
            {showPopup && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="p-6 bg-white rounded-xl shadow-lg text-center">
                        <h2 className="text-2xl font-bold text-green-600">🎉 Grievance Resolved! 🎉</h2>
                        <p className="mt-2 text-lg text-gray-700">The issue has been successfully addressed.</p>
                    </div>
                </div>
            )}
            {}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📑 Grievance Details</h2>
            <p className="text-gray-500 text-sm mb-6">Tracking ID: <span className="font-medium">{grievance.grievanceCode}</span></p>
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <p className="text-lg"><strong>Complainant Name:</strong> {grievance.complainantName}</p>
                    <p className="text-lg"><strong>Registered Email:</strong> {grievance.complainantEmail}</p>
                    <p className="text-lg"><strong>Date of Filing:</strong> {new Date(grievance.createdAt).toISOString().split("T")[0]}</p>
                    {}
                    <div className="flex items-center gap-3">
                        <strong className="text-lg">Priority Level:</strong>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                            grievance.priority === 'Critical' ? 'bg-red-600 text-white' :
                            grievance.priority === 'High' ? 'bg-orange-500 text-white' :
                            grievance.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-green-500 text-white'
                        }`}>
                            {grievance.priority || 'Medium'}
                        </span>
                    </div>
                    {grievance.priorityReason && (
                        <div className="p-3 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                            <p className="text-sm text-gray-700">
                                <strong>Priority Reason:</strong> {grievance.priorityReason}
                            </p>
                        </div>
                    )}
                    <p className="text-lg"><strong>Issue Description:</strong> {grievance.description}</p>
                    {grievance.location && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                            <p className="text-lg font-semibold text-blue-800 mb-2">📍 Location Information</p>
                            <div className="space-y-1 text-sm text-gray-700">
                                <p><strong>Latitude:</strong> {grievance.location.latitude?.toFixed(6)}</p>
                                <p><strong>Longitude:</strong> {grievance.location.longitude?.toFixed(6)}</p>
                                {grievance.location.accuracy && (
                                    <p><strong>Accuracy:</strong> ±{Math.round(grievance.location.accuracy)}m</p>
                                )}
                                <a
                                    href={`https://www.google.com/maps?q=${grievance.location.latitude},${grievance.location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition duration-200"
                                >
                                    🗺️ View on Google Maps
                                </a>
                            </div>
                        </div>
                    )}
                    {}
                    {(grievance.isDuplicate || (grievance.linkedComplaints && grievance.linkedComplaints.length > 0)) && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-600">
                            <div className="flex items-center gap-3 mb-3">
                                <p className="text-lg font-semibold text-purple-800">
                                    🔗 {grievance.isDuplicate ? 'Duplicate Complaint' : 'Linked Complaints'}
                                </p>
                                {grievance.duplicateGroup && (
                                    <span className="px-3 py-1 rounded text-sm font-bold bg-gray-800 text-white">
                                        Group: {grievance.duplicateGroup}
                                    </span>
                                )}
                            </div>
                            {grievance.isDuplicate && grievance.linkedTo && (
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p><strong>Status:</strong> This is a duplicate complaint</p>
                                    <p><strong>Linked to:</strong> {grievance.linkedTo}</p>
                                    {grievance.similarityScore && (
                                        <p><strong>Similarity:</strong> {grievance.similarityScore}%</p>
                                    )}
                                    {grievance.duplicateReason && (
                                        <p className="mt-2 p-2 bg-white rounded border border-purple-200">
                                            <strong>Reason:</strong> {grievance.duplicateReason}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => navigate(`/grievance/${grievance.linkedTo}`)}
                                        className="mt-3 px-4 py-2 bg-purple-600 text-white font-medium hover:bg-purple-700 transition duration-200 rounded"
                                    >
                                        View Parent Complaint →
                                    </button>
                                </div>
                            )}
                            {grievance.linkedComplaints && grievance.linkedComplaints.length > 0 && (
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p><strong>Status:</strong> This complaint has {grievance.linkedComplaints.length} linked duplicate(s)</p>
                                    <div className="mt-3 space-y-2">
                                        {grievance.linkedComplaints.map((code, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => navigate(`/grievance/${code}`)}
                                                className="block w-full text-left px-3 py-2 bg-white rounded border border-purple-200 hover:bg-purple-100 transition duration-200"
                                            >
                                                📎 {code}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-lg flex items-center">
                        <strong>AI Assistance Used:</strong>
                        <input 
                            type="checkbox" 
                            checked={grievance.aiResolved} 
                            onChange={aiResolvedTick}
                            className="ml-2 w-5 h-5 cursor-pointer accent-green-500" 
                        />
                    </p>
                    {grievance.fileName ? (
                        <p className="text-lg hover:text-blue-700 hover:underline cursor-pointer" onClick={showFile}>
                            <strong>📄 View Uploaded Document</strong>
                        </p>
                    ) : (
                        <p className="text-lg text-gray-500">
                            <strong>📄 No Document Uploaded</strong>
                        </p>
                    )}
                    {}
                    <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">💬 Ask Question to Client</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Send a question or request additional information from {grievance.complainantName}
                        </p>
                        <textarea
                            value={questionToClient}
                            onChange={(e) => setQuestionToClient(e.target.value)}
                            placeholder="Type your question here... (e.g., Can you provide more details about the issue? Do you have any additional documents?)"
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                        />
                        <button
                            onClick={sendQuestionToClient}
                            disabled={sendingQuestion}
                            className={`mt-3 w-full py-2 px-4 rounded-lg font-semibold transition duration-200 ${
                                sendingQuestion 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {sendingQuestion ? '📤 Sending...' : '📧 Send Question to Client'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            ✉️ Message will be sent to: {grievance.complainantEmail}
                        </p>
                    </div>
                    {}
                    {grievance.adminQuestions && grievance.adminQuestions.length > 0 && (
                        <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Questions & Replies History</h3>
                            <div className="space-y-4">
                                {grievance.adminQuestions.map((q, index) => (
                                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                        {}
                                        <div className="mb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm text-blue-600 font-semibold">
                                                    ❓ Question from: {q.askedBy}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(q.askedAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                            <p className="text-gray-800 bg-blue-50 p-3 rounded">{q.question}</p>
                                        </div>
                                        {}
                                        {q.reply ? (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-sm text-green-600 font-semibold">
                                                        ✅ Client Reply:
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(q.repliedAt).toLocaleDateString('en-IN')}
                                                    </p>
                                                </div>
                                                <p className="text-gray-800 bg-green-50 p-3 rounded">{q.reply}</p>
                                                {q.replyDocument && (
                                                    <a
                                                        href={`http://localhost:5000/file/${q.replyDocument}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                                    >
                                                        📎 View Client's Attached Document
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm text-gray-500 italic">
                                                    ⏳ Waiting for client's reply...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-6 ">
                    <div className="p-5 bg-gray-100 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">📌 Grievance Progress</h3>
                        <div className="flex flex-wrap gap-3">
                            {Object.keys(stageColors).map((stage) => (
                                <button key={stage} onClick={() => handleStageClick(stage)}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition cursor-pointer transform duration-200 ${
                                        currentStage === stage ? `scale-105 shadow-lg ${stageColors[stage].active}` : `${stageColors[stage].default}`
                                    }`}
                                >{stage}</button>
                            ))}
                        </div>
                    </div>
                    {}
                    <AIResolutionGenerator 
                        grievanceCode={grievanceCode}
                        onResolutionGenerated={handleResolutionGenerated}
                    />
                    {}
                    {grievance.aiResolutionText && (
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-600 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-indigo-900">AI Generated Resolution</h3>
                                {grievance.aiResolved && (
                                    <span className="ml-auto px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                        ✓ AI Resolved
                                    </span>
                                )}
                            </div>
                            <div className="bg-white p-5 rounded-lg shadow-inner border border-indigo-100">
                                <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {grievance.aiResolutionText}
                                </div>
                            </div>
                            {}
                            {grievance.aiResolutionPDF && (
                                <div className="mt-4 flex gap-3">
                                    <a
                                        href={`http://localhost:5000/download/${grievance.aiResolutionPDF}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download PDF
                                    </a>
                                    <a
                                        href={`http://localhost:5000/file/${grievance.aiResolutionPDF}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View PDF
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    <AIPDFAnalyzer />
                </div>
            </div>
        </div>
    );
}
export default GrievanceDetail;
