import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";

export default function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { language, setLanguage, t } = useLanguage();

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    return (
        <div>
            <header className="flex items-center justify-between p-4 md:p-6 shadow bg-green-100 relative">
                <Link to="/">
                    <div className="flex items-center gap-2">
                        <div className="rounded-l w-10 h-10 flex items-center justify-center">
                            <img
                                src="/new_logo.png"
                                alt="ShramiKare Logo"
                                className="rounded-lg max-h-32 shadow mt-6 mb-2"
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = "/sample_aadhar.png";
                                }}
                            />
                        </div>
                        <span className="text-green-900 font-bold text-xl">{t("title")}</span>
                    </div>
                    <span className="block text-xs italic text-green-700 font-medium mt-1 ml-10">
                        {t("tagline")}
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Language Selector Dropdown */}
                    <div className="relative">
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            className="bg-white text-green-800 border border-green-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                            <option value="ml">മലയാളം</option>
                            <option value="ta">தமிழ்</option>
                            <option value="bn">বাংলা</option>
                        </select>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden xl:flex gap-6 text-blue-700 font-medium items-center">
                        <Link to="/login" className="hover:text-blue-900 transition">{t("login")}</Link>
                        <Link to="/doctor-details" className="hover:text-blue-900 transition">{t("doctorDetails")}</Link>
                        <Link to="/aadhaar-capture" className="hover:text-blue-900 transition">{t("aadhaarViewer")}</Link>
                        <Link to="/digital-id" className="hover:text-blue-900 transition">{t("digitalId")}</Link>
                        <Link to="/scan" className="bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-600 transition flex items-center gap-1.5 text-sm">
                            <span>📷</span> {t("scanQr")}
                        </Link>
                        <Link to="/admin/dashboard" className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500 transition flex items-center gap-1.5 text-sm">
                            <span>📊</span> {t("dashboard")}
                        </Link>
                    </nav>

                    {/* Hamburger for mobile/tablet */}
                    <button
                        className="xl:hidden flex items-center px-2 py-1"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-7 h-7 text-green-700"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile/Tablet nav */}
                {menuOpen && (
                    <nav className="absolute top-full left-0 w-full bg-green-100 shadow-md flex flex-col gap-4 py-4 px-6 xl:hidden z-20">
                        <Link to="/login" onClick={() => setMenuOpen(false)} className="text-blue-700 font-medium">{t("login")}</Link>
                        <Link to="/doctor-details" onClick={() => setMenuOpen(false)} className="text-blue-700 font-medium">{t("doctorDetails")}</Link>
                        <Link to="/aadhaar-capture" onClick={() => setMenuOpen(false)} className="text-blue-700 font-medium">{t("aadhaarViewer")}</Link>
                        <Link to="/digital-id" onClick={() => setMenuOpen(false)} className="text-blue-700 font-medium">{t("digitalId")}</Link>
                        <Link to="/scan" onClick={() => setMenuOpen(false)} className="bg-green-700 text-white px-4 py-2 rounded text-center font-medium">
                            📷 {t("scanQr")}
                        </Link>
                        <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="bg-blue-600 text-white px-4 py-2 rounded text-center font-medium">
                            📊 {t("dashboard")}
                        </Link>
                    </nav>
                )}
            </header>

            <main>
                <Outlet />
            </main>

            <footer className="py-6 text-center bg-blue-100 text-blue-700 border-t mt-14 text-sm font-medium">
                © 2025 {t("title")} | {t("tagline")}
            </footer>
        </div>
    );
}
