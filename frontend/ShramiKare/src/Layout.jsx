import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Layout({ userId, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) onLogout();
        setMenuOpen(false);
        navigate("/");
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
                        <span className="text-green-900 font-bold text-xl">ShramiKare</span>
                    </div>
                    <span className="block text-xs italic text-green-700 font-medium mt-1 ml-10">
                        Care for the hands that build
                    </span>
                </Link>
                {/* Hamburger for mobile */}
                <button
                    className="md:hidden flex items-center px-2 py-1"
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
                {/* Desktop nav */}
                <nav className="hidden md:flex gap-6 items-center font-medium">
                    <Link to="/doctor-details" className="text-blue-700 hover:text-blue-900 transition">Doctor Details</Link>
                    <Link to="/aadhaar-capture" className="text-blue-700 hover:text-blue-900 transition">Aadhaar Viewer</Link>
                    <Link to="/digital-id" className="text-blue-700 hover:text-blue-900 transition">Digital ID</Link>
                    {userId ? (
                        <button
                            onClick={handleLogout}
                            className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 px-4 py-1.5 rounded-lg font-semibold transition"
                        >
                            Logout
                        </button>
                    ) : (
                        <>
                            <Link to="/login" className="bg-green-700 text-white hover:bg-green-600 px-4 py-1.5 rounded-lg font-semibold transition">Login</Link>
                            <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded-lg font-semibold transition">Register</Link>
                        </>
                    )}
                </nav>
                {/* Mobile nav */}
                {menuOpen && (
                    <nav className="absolute top-full left-0 w-full bg-green-100 shadow-md flex flex-col gap-4 py-4 px-6 md:hidden z-10">
                        <Link to="/doctor-details" onClick={() => setMenuOpen(false)} className="text-blue-700">Doctor Details</Link>
                        <Link to="/aadhaar-capture" onClick={() => setMenuOpen(false)} className="text-blue-700">Aadhaar Viewer</Link>
                        <Link to="/digital-id" onClick={() => setMenuOpen(false)} className="text-blue-700">Digital ID</Link>
                        {userId ? (
                            <button onClick={handleLogout} className="text-red-700 font-semibold text-left">Logout</button>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-green-700 font-semibold">Login</Link>
                                <Link to="/register" onClick={() => setMenuOpen(false)} className="text-blue-700 font-semibold">Register</Link>
                            </>
                        )}
                    </nav>
                )}
            </header>

            <main>
                <Outlet />
            </main>

            <footer className="py-6 text-center bg-blue-100 text-blue-700 border-t mt-14 text-sm">
                © 2025 ShramiKare | Care for the hands that build
            </footer>
        </div>
    );
}
