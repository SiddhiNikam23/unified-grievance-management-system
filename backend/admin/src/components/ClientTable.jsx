import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FilterTabs from "./FilterTabs";
const ClientTable = ({ grievances: propGrievances }) => {
    const navigate = useNavigate();
    const [loadingGrievance, setLoadingGrievance] = useState(null);
    const [filteredGrievances, setFilteredGrievances] = useState([]);
    const [lastEscalatedCount, setLastEscalatedCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 5;
    const playAlertSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zooVARC0yl4fG5ZRwFNo3V7859LwUofsz');
        audio.play().catch(e => console.log('Audio play failed:', e));
    };
    const sortByPriority = (grievances) => {
        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return [...grievances].sort((a, b) => {
            const aPriority = priorityOrder[a.priority] ?? 2;
            const bPriority = priorityOrder[b.priority] ?? 2;
            return aPriority - bPriority;
        });
    };
    useEffect(() => {
        if (propGrievances) {
            const sorted = sortByPriority(propGrievances);
            setFilteredGrievances(sorted);
            const escalatedCount = sorted.filter(g => g.isEscalated).length;
            if (escalatedCount > lastEscalatedCount && lastEscalatedCount > 0) {
                playAlertSound();
                if (Notification.permission === 'granted') {
                    new Notification('🚨 New Escalated Complaint!', {
                        body: `${escalatedCount - lastEscalatedCount} new critical complaint(s) require immediate attention`,
                        icon: '/alert-icon.png'
                    });
                }
            }
            setLastEscalatedCount(escalatedCount);
        }
    }, [propGrievances]);
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);
    const generatePDF = async (grievance) => {
        setLoadingGrievance(grievance.grievanceCode);
        try {
            let aiSolution = grievance.aiResolutionText || "Solution: Please review this grievance and take appropriate action as per department guidelines.";
            const cleanText = (text) => {
                return text
                    .replace(/[^\x00-\x7F]/g, '') 
                    .replace(/\*\*/g, '') 
                    .replace(/#{1,6}\s/g, '') 
                    .replace(/[━─│┌┐└┘├┤┬┴┼]/g, '') 
                    .replace(/^\s*[\*\-\•]\s*/gm, '') 
                    .replace(/^\s*\d+\.\s*/gm, '') 
                    .replace(/\n\s*\n/g, '\n') 
                    .replace(/\s+/g, ' ') 
                    .trim();
            };
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Grievance Report", 14, 20);
            const tableColumn = ["Field", "Value"];
            const tableRows = [
                ["Grievance Code", grievance.grievanceCode],
                ["Complainant Name", grievance.complainantName],
                ["Description", grievance.description || "No description available"],
                ["Date of Receipt", new Date(grievance.createdAt).toISOString().split("T")[0]],
                ["Complainant Email", grievance.complainantEmail],
                ["AI Resolved", grievance.aiResolved ? "Yes" : "No"],
                ["Current Status", grievance.currentStatus],
                ["AI Proposed Solution", cleanText(aiSolution)],
            ];
            doc.autoTable({
                startY: 30,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: {
                    fillColor: [41, 128, 185], 
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 12,
                    halign: 'left'
                },
                bodyStyles: {
                    fontSize: 10,
                    cellPadding: 5
                },
                columnStyles: {
                    0: { 
                        cellWidth: 50,
                        fontStyle: 'normal',
                        fillColor: [245, 245, 245] 
                    },
                    1: { 
                        cellWidth: 130,
                        fontStyle: 'normal'
                    }
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 5,
                    fontSize: 10,
                    valign: 'top'
                }
            });
            doc.save(`Grievance_${grievance.grievanceCode}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setLoadingGrievance(null);
        }
    };
    const toggleAIResolved = (index, event) => {
        event.stopPropagation(); 
        const updatedGrievances = [...filteredGrievances];
        updatedGrievances[index].aiResolved = !updatedGrievances[index].aiResolved;
        setFilteredGrievances(updatedGrievances);
    };
    const indexOfLastItem = currentPage * entriesPerPage;
    const indexOfFirstItem = indexOfLastItem - entriesPerPage;
    const currentGrievances = filteredGrievances.slice(indexOfFirstItem, indexOfLastItem);
    const nextPage = () => {
        if (currentPage < Math.ceil(filteredGrievances.length / entriesPerPage)) {
            setCurrentPage((prev) => prev + 1);
        }
    };
    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };
    return (
        <div className="container mx-auto px-4">
            <FilterTabs grievances={propGrievances || []} setFilteredGrievances={setFilteredGrievances} />
            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                <table className="min-w-full border-collapse rounded-lg">
                    <thead className="bg-gray-800 text-white sticky top-0">
                        <tr>
                            {["Grievance Code", "Complainant", "Description", "Date", "Priority", "Duplicate", "AI Resolved", "Status", "Download"]
                                .map((header, index) => (
                                    <th key={index} className="py-3 px-4 text-left font-medium">{header}</th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentGrievances.length > 0 ? (
                            currentGrievances.map((client, index) => {
                                const getPriorityBadge = (priority) => {
                                    const colors = {
                                        'Critical': 'bg-red-600 text-white',
                                        'High': 'bg-orange-500 text-white',
                                        'Medium': 'bg-yellow-500 text-white',
                                        'Low': 'bg-green-500 text-white'
                                    };
                                    return (
                                        <span 
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${colors[priority] || 'bg-gray-500 text-white'}`}
                                            title={client.priorityReason || 'Priority assigned by AI'}
                                        >
                                            {priority || 'Medium'}
                                        </span>
                                    );
                                };
                                return (
                                    <tr
                                        key={index}
                                        className={`border-b hover:bg-gray-100 transition duration-200 cursor-pointer ${
                                            client.isEscalated 
                                                ? "bg-red-50 border-l-4 border-l-red-600 animate-pulse" 
                                                : index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                        }`}
                                        onClick={() => navigate(`/grievance/${client.grievanceCode}`)}
                                    >
                                        <td className="py-3 px-4 font-semibold">
                                            <div className="flex items-center gap-2">
                                                {client.isEscalated && <span className="text-red-600">🚨</span>}
                                                {client.duplicateGroup && (
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-800 text-white">
                                                        {client.duplicateGroup}
                                                    </span>
                                                )}
                                                <span>{client.grievanceCode}</span>
                                            </div>
                                            {client.isDuplicate && (
                                                <div className="mt-1">
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                        🔗 Linked to {client.linkedTo || 'parent'}
                                                    </span>
                                                </div>
                                            )}
                                            {client.linkedComplaints && client.linkedComplaints.length > 0 && (
                                                <div className="mt-1">
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        📎 {client.linkedComplaints.length} linked
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">{client.complainantName}</td>
                                        <td className="py-3 px-4">{client.description?.slice(0, 30) + "..."}</td>
                                        <td className="py-3 px-4">{new Date(client.createdAt).toISOString().split("T")[0]}</td>
                                        <td className="py-3 px-4">{getPriorityBadge(client.priority)}</td>
                                        <td className="py-3 px-4 text-center">
                                            {client.isDuplicate ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                                                    DUPLICATE
                                                </span>
                                            ) : client.linkedComplaints && client.linkedComplaints.length > 0 ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                                                    PARENT ({client.linkedComplaints.length})
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white">
                                                    UNIQUE
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={client.aiResolved}
                                                readOnly
                                                className="w-5 h-5 cursor-default pointer-events-none"
                                            />
                                        </td>
                                        <td className="py-3 px-4">{client.currentStatus}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center transition duration-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generatePDF(client);
                                                }}
                                                disabled={loadingGrievance === client.grievanceCode}
                                            >
                                                {loadingGrievance === client.grievanceCode ? "Downloading..." : "Download"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center py-4 text-gray-500">No grievances found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {}
            <div className="mt-5 flex justify-between items-center">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                        currentPage === 1
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                    Prev
                </button>
                <p className="text-gray-700">
                    Page {currentPage} of {Math.max(1, Math.ceil(filteredGrievances.length / entriesPerPage))}
                </p>
                <button
                    onClick={nextPage}
                    disabled={currentPage === Math.ceil(filteredGrievances.length / entriesPerPage)}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                        currentPage === Math.ceil(filteredGrievances.length / entriesPerPage)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
export default ClientTable;
