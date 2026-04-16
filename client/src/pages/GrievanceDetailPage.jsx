import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
function GrievanceDetailPage() {
    const { grievanceCode } = useParams();
    const navigate = useNavigate();
    const [grievance, setGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyFile, setReplyFile] = useState(null);
    const [sendingReply, setSendingReply] = useState(false);
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
    const handleReplySubmit = async (questionIndex) => {
        if (!replyText.trim()) {
            alert("⚠️ Please enter a reply!");
            return;
        }
        setSendingReply(true);
        try {
            let uploadedFileName = null;
            if (replyFile) {
                const formData = new FormData();
                formData.append("file", replyFile);
                const uploadResponse = await fetch("http://localhost:5000/upload", {
                    method: "POST",
                    body: formData,
                });
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    uploadedFileName = uploadResult.filename;
                } else {
                    alert("❌ File upload failed");
                    setSendingReply(false);
                    return;
                }
            }
            const response = await fetch(
                `http://localhost:5000/grievance/grievanceCode/${grievanceCode}/question/${questionIndex}/reply`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        reply: replyText,
                        replyDocument: uploadedFileName,
                    }),
                }
            );
            if (response.ok) {
                const updatedGrievance = await response.json();
                setGrievance(updatedGrievance);
                setReplyText("");
                setReplyFile(null);
                setReplyingTo(null);
                alert("✅ Reply sent successfully!");
            } else {
                alert("❌ Failed to send reply");
            }
        } catch (error) {
            console.error("Error sending reply:", error);
            alert("❌ Failed to send reply");
        } finally {
            setSendingReply(false);
        }
    };
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <div className="flex-grow flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <Footer />
            </div>
        );
    }
    if (!grievance) {
        return (
            <div className="min-h-screen flex flex-col">
                <div className="flex-grow flex justify-center items-center">
                    <div className="text-center">
                        <p className="text-xl text-gray-600 mb-4">❌ Grievance not found</p>
                        <button
                            onClick={() => navigate("/homepage")}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
    const statusColors = {
        "Complaint Filed": "bg-green-100 text-green-800",
        "Under Review": "bg-yellow-100 text-yellow-800",
        "Investigation": "bg-blue-100 text-blue-800",
        "Resolution Provided": "bg-gray-100 text-gray-800",
        "Rejected": "bg-red-100 text-red-800"
    };
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
                { }
                <button
                    onClick={() => navigate("/homepage")}
                    className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>
                { }
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="border-b pb-4 mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Grievance Details</h1>
                        <p className="text-gray-500">Tracking ID: <span className="font-semibold text-gray-700">{grievance.grievanceCode}</span></p>
                    </div>
                    { }
                    <div className="mb-6">
                        <span className={`inline-block px-4 py-2 rounded-full font-semibold ${statusColors[grievance.currentStatus]}`}>
                            {grievance.currentStatus}
                        </span>
                    </div>
                    { }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Department</p>
                            <p className="text-lg font-semibold text-gray-800">{grievance.department}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Date Filed</p>
                            <p className="text-lg font-semibold text-gray-800">
                                {new Date(grievance.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    { }
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Issue Description</h3>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                            {grievance.description}
                        </p>
                    </div>
                    { }
                    {grievance.adminQuestions && grievance.adminQuestions.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="mr-2">💬</span>
                                Questions from Department
                            </h3>
                            <div className="space-y-4">
                                {grievance.adminQuestions.map((q, index) => (
                                    <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm text-blue-600 font-semibold">
                                                From: {q.askedBy}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(q.askedAt).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                        <p className="text-gray-800 mb-3">{q.question}</p>
                                        { }
                                        {q.reply && (
                                            <div className="mt-3 pt-3 border-t border-blue-200 bg-green-50 p-3 rounded">
                                                <p className="text-sm text-green-700 font-semibold mb-2">
                                                    ✅ Your Reply (sent on {new Date(q.repliedAt).toLocaleDateString('en-IN')}):
                                                </p>
                                                <p className="text-gray-800">{q.reply}</p>
                                                {q.replyDocument && (
                                                    <a
                                                        href={`http://localhost:5000/file/${q.replyDocument}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        📎 View Attached Document
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {!q.reply && replyingTo === index ? (
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Type your reply here..."
                                                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="4"
                                                />
                                                <div className="mt-2">
                                                    <label className="block text-sm text-gray-600 mb-2">
                                                        📎 Attach Document (optional)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf,image/*"
                                                        onChange={(e) => setReplyFile(e.target.files[0])}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleReplySubmit(index)}
                                                        disabled={sendingReply}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                                    >
                                                        {sendingReply ? "Sending..." : "Send Reply"}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText("");
                                                            setReplyFile(null);
                                                        }}
                                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : !q.reply && (
                                            <button
                                                onClick={() => setReplyingTo(index)}
                                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Reply to Question
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(!grievance.adminQuestions || grievance.adminQuestions.length === 0) && (
                        <div className="mb-8 bg-gray-50 p-6 rounded-lg text-center">
                            <p className="text-gray-500">
                                ℹ️ No questions from the department yet. You will be notified if additional information is needed.
                            </p>
                        </div>
                    )}
                    { }
                    {grievance.fileName && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Document</h3>
                            <a
                                href={`http://localhost:5000/file/${grievance.fileName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                📄 View Document
                            </a>
                        </div>
                    )}
                    { }
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Timeline</h3>
                        <div className="space-y-3">
                            {["Complaint Filed", "Under Review", "Investigation", "Resolution Provided"].map((stage, index) => {
                                const stages = ["Complaint Filed", "Under Review", "Investigation", "Resolution Provided"];
                                const currentIndex = stages.indexOf(grievance.currentStatus);
                                const isCompleted = index <= currentIndex;
                                const isCurrent = index === currentIndex;
                                return (
                                    <div key={stage} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                                            }`}>
                                            {isCompleted ? '✓' : index + 1}
                                        </div>
                                        <div className="ml-4">
                                            <p className={`font-semibold ${isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {stage}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
export default GrievanceDetailPage;