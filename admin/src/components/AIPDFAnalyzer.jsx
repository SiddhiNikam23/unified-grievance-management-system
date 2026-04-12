import React, { useState } from "react";
const AIAnalyzer = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const askQuestion = async () => {
        if (!question.trim()) {
            alert("Please enter a question!");
            return;
        }
        setLoading(true);
        setAnswer("");
        try {
            const response = await fetch("http://localhost:5000/grievance/ai-assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ question }),
            });
            if (response.ok) {
                const data = await response.json();
                setAnswer(data.answer);
            } else {
                setAnswer("AI service is currently unavailable. Please try again later.");
            }
        } catch (error) {
            console.error("AI Error:", error);
            setAnswer("AI service is currently unavailable. Please try again later or contact technical support.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{ maxWidth: "650px", margin: "auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ textAlign: "center" }}>AI Grievance Assistant</h2>
            <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginBottom: "15px" }}>
                Ask questions about grievance resolution, procedures, or get AI suggestions
            </p>
            {}
            <textarea
                placeholder="Ask a question... (e.g., How to resolve electricity complaints? What documents are needed?)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "10px", minHeight: "80px", fontSize: "14px" }}
            />
            {}
            <button
                onClick={askQuestion}
                style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: loading ? "#ccc" : "#28A745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginBottom: "10px",
                    fontSize: "16px",
                    fontWeight: "600"
                }}
                disabled={loading}
            >
                {loading ? "Processing..." : "Get AI Assistance"}
            </button>
            {}
            {answer && (
                <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#F8F9FA", marginTop: "10px" }}>
                    <strong style={{ color: "#28A745" }}>AI Response:</strong>
                    <p style={{ marginTop: "10px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{answer}</p>
                </div>
            )}
            {!answer && !loading && (
                <div style={{ padding: "15px", border: "1px dashed #ddd", borderRadius: "4px", backgroundColor: "#f9f9f9", marginTop: "10px", textAlign: "center", color: "#999" }}>
                    <p>💡 Ask any question about grievance resolution and get AI-powered suggestions</p>
                </div>
            )}
        </div>
    );
};
export default AIAnalyzer;
