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

    const getStatusBadge = (status) => {
        const styles = {
            "Under Review": "bg-amber-100 text-amber-800",
            "Complaint Filed": "bg-indigo-100 text-indigo-800",
            "Investigation": "bg-sky-100 text-sky-800",
            "Resolved": "bg-emerald-100 text-emerald-800",
            "Resolution Provided": "bg-emerald-100 text-emerald-800",
            "Rejected": "bg-rose-100 text-rose-800"
        };

        return (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="mx-auto">
            <FilterTabs grievances={propGrievances || []} setFilteredGrievances={setFilteredGrievances} />
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            {["Grievance Code", "Complainant", "Description", "Date", "Priority", "Duplicate", "AI Resolved", "Status", "Download"]
                                .map((header, index) => (
                                    <th key={index} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-700">{header}</th>
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
                                        className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                                            client.isEscalated 
                                                ? "bg-red-50" 
                                                : index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                        }`}
                                        onClick={() => navigate(`/grievance/${client.grievanceCode}`)}
                                    >
                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            <div className="flex items-center gap-2">
                                                {client.isEscalated && <span className="text-red-600">🚨</span>}
                                                {client.duplicateGroup && (
                                                    <span className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-white">
                                                        {client.duplicateGroup}
                                                    </span>
                                                )}
                                                <span>{client.grievanceCode}</span>
                                            </div>
                                            {client.isDuplicate && (
                                                <div className="mt-1">
                                                    <span className="rounded-full bg-fuchsia-100 px-2 py-1 text-xs text-fuchsia-700">
                                                        🔗 Linked to {client.linkedTo || 'parent'}
                                                    </span>
                                                </div>
                                            )}
                                            {client.linkedComplaints && client.linkedComplaints.length > 0 && (
                                                <div className="mt-1">
                                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                                        📎 {client.linkedComplaints.length} linked
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{client.complainantName}</td>
                                        <td className="max-w-[260px] px-4 py-3 text-gray-600" title={client.description || ""}>
                                            {client.description ? `${client.description.slice(0, 45)}${client.description.length > 45 ? "..." : ""}` : "No description"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">{new Date(client.createdAt).toISOString().split("T")[0]}</td>
                                        <td className="px-4 py-3">{getPriorityBadge(client.priority)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {client.isDuplicate ? (
                                                <span className="rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white">
                                                    DUPLICATE
                                                </span>
                                            ) : client.linkedComplaints && client.linkedComplaints.length > 0 ? (
                                                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                                                    PARENT ({client.linkedComplaints.length})
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-400 px-3 py-1 text-xs font-bold text-white">
                                                    UNIQUE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={client.aiResolved}
                                                readOnly
                                                className="h-5 w-5 cursor-default pointer-events-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(client.currentStatus)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                className="flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
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
                                <td colSpan="9" className="py-8 text-center text-gray-500">No grievances found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                        currentPage === 1
                            ? "cursor-not-allowed bg-gray-200 text-gray-400"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    Prev
                </button>
                <p className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {Math.max(1, Math.ceil(filteredGrievances.length / entriesPerPage))}
                </p>
                <button
                    onClick={nextPage}
                    disabled={currentPage === Math.ceil(filteredGrievances.length / entriesPerPage)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                        currentPage === Math.ceil(filteredGrievances.length / entriesPerPage)
                            ? "cursor-not-allowed bg-gray-200 text-gray-400"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
export default ClientTable;
