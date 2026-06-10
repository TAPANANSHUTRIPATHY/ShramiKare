import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL } from "../config";

export default function OutbreakDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertSending, setAlertSending] = useState(false);
    const [alertSuccess, setAlertSuccess] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/outbreak-metrics/`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to load metrics", error);
        } finally {
            setLoading(false);
        }
    };

    const triggerAlerts = async () => {
        if (!confirm("Are you sure you want to send emergency SMS alerts to all users pending follow-ups?")) return;
        try {
            setAlertSending(true);
            const res = await fetch(`${API_BASE_URL}/send-followup-reminders/`);
            const result = await res.json();
            setAlertSuccess(result.message || "Alerts sent successfully!");
            setTimeout(() => setAlertSuccess(""), 5000);
        } catch (error) {
            alert("Failed to send alerts.");
        } finally {
            setAlertSending(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500 font-medium">Loading Dashboard AI...</div>;
    }

    if (!data || !data.success) {
        return <div className="p-10 text-center text-red-500 font-medium">Failed to load outbreak metrics.</div>;
    }

    const { ai_report, total_workers, pct_dose1, pct_dose2, symptoms, districts } = data;
    const severityColor = ai_report.severity_score > 60 ? "text-red-600" : ai_report.severity_score > 30 ? "text-yellow-600" : "text-green-600";
    
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">AI Health Dashboard & Outbreak Alert</h1>
                    <p className="text-gray-500">Real-time health surveillance for migrant worker districts</p>
                </div>
                <button 
                    onClick={triggerAlerts}
                    disabled={alertSending}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                >
                    {alertSending ? "Sending Alerts..." : "🚨 Trigger SMS Alerts"}
                </button>
            </div>

            {alertSuccess && (
                <div className="bg-green-100 text-green-800 p-4 rounded-lg font-medium shadow-sm border border-green-200">
                    ✅ {alertSuccess}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Summary Card */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <span>🤖</span> AI Outbreak Analysis
                    </h2>
                    <div className="prose prose-blue max-w-none text-gray-700 bg-blue-50 p-6 rounded-lg border border-blue-100">
                        <ReactMarkdown>{ai_report.summary}</ReactMarkdown>
                    </div>
                </div>

                {/* Severity Card */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                    <h2 className="text-lg font-bold text-gray-700 mb-2">Severity Index</h2>
                    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                            <path
                                className="text-gray-200"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className={severityColor}
                                strokeDasharray={`${ai_report.severity_score}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                        </svg>
                        <div className="absolute text-4xl font-black text-gray-800">
                            {ai_report.severity_score}
                        </div>
                    </div>
                    {ai_report.outbreak_flag ? (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">High Risk</span>
                    ) : (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Normal</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">Total Workers</div>
                    <div className="text-3xl font-black text-indigo-700">{total_workers}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">Vaccine Dose 1</div>
                    <div className="text-3xl font-black text-indigo-700">{pct_dose1.toFixed(1)}%</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">Vaccine Dose 2</div>
                    <div className="text-3xl font-black text-indigo-700">{pct_dose2.toFixed(1)}%</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">Districts Covered</div>
                    <div className="text-3xl font-black text-indigo-700">{Object.keys(districts).length}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Top Active Symptoms</h3>
                    <ul className="space-y-3">
                        {Object.entries(symptoms).sort((a,b)=>b[1]-a[1]).map(([sym, count]) => (
                            <li key={sym} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-700">{sym}</span>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">District Heatmap</h3>
                    <ul className="space-y-3">
                        {Object.entries(districts).sort((a,b)=>b[1]-a[1]).map(([dist, count]) => (
                            <li key={dist} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-700">{dist}</span>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">{count} cases</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
