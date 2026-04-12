import React, { useState } from "react";
import { FileText, Download, CheckCircle } from "lucide-react";
const AIResolutionGenerator = ({ grievanceCode, onResolutionGenerated }) => {
    const [generating, setGenerating] = useState(false);
    const [resolution, setResolution] = useState(null);
    const [error, setError] = useState(null);
    const generateAIResolution = async () => {
        setGenerating(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/grievance/grievanceCode/${grievanceCode}/ai-resolve`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );
            if (response.ok) {
                const data = await response.json();
                setResolution(data);
                alert("✅ AI Resolution Generated Successfully!\n\nThe grievance has been marked as resolved and a PDF report has been generated.");
                if (onResolutionGenerated) {
                    onResolutionGenerated(data);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Failed to generate resolution");
                alert("❌ Failed to generate AI resolution. Please try again.");
            }
        } catch (err) {
            console.error("AI Resolution Error:", err);
            setError("Network error. Please check your connection.");
            alert("❌ Network error. Please try again.");
        } finally {
            setGenerating(false);
        }
    };
    const downloadPDF = () => {
        if (resolution && resolution.pdfFileName) {
            window.open(`http://localhost:5000/download/${resolution.pdfFileName}`, "_blank");
        }
    };
    return (
        <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-md">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="text-purple-600" size={24} />
                <h3 className="text-lg font-semibold text-purple-800">
                    AI Resolution Generator
                </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
                Generate an AI-powered resolution with automatic PDF report creation. 
                The system will analyze the grievance and provide a professional resolution document.
            </p>
            {!resolution ? (
                <button
                    onClick={generateAIResolution}
                    disabled={generating}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                        generating
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                    }`}
                >
                    {generating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating AI Resolution...
                        </>
                    ) : (
                        <>
                            <FileText size={20} />
                            Generate AI Resolution & PDF
                        </>
                    )}
                </button>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border border-green-300">
                        <CheckCircle className="text-green-600" size={20} />
                        <span className="text-sm font-semibold text-green-800">
                            Resolution Generated Successfully!
                        </span>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                            AI Resolution:
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {resolution.resolution}
                        </p>
                    </div>
                    <button
                        onClick={downloadPDF}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <Download size={18} />
                        Download PDF Report
                    </button>
                </div>
            )}
            {error && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                    <p className="text-sm text-red-800">
                        ❌ Error: {error}
                    </p>
                </div>
            )}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> AI-generated resolutions should be reviewed by an officer before final approval. 
                    The PDF will be automatically attached to the grievance record.
                </p>
            </div>
        </div>
    );
};
export default AIResolutionGenerator;
