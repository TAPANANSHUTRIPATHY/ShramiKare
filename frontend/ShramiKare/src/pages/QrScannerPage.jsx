import React, { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";

export default function QrScannerPage() {
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Cleanup webcam when unmounting
    useEffect(() => {
        return () => {
            stopWebcam();
        };
    }, []);

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setScanning(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processImage(file);
    };

    const processImage = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    setScanResult(code.data);
                    fetchUserData(code.data);
                } else {
                    setError("No QR code found in the image.");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processImage(file);
    };

    const fetchUserData = async (qrData) => {
        setLoading(true);
        setError(null);
        setUserData(null);
        try {
            // Parse Aadhaar from QR string if it's a URL or direct ID
            let aadhaarId = qrData;
            // Example of parsing simple URL parameter: http://domain/scan?id=1234
            if (qrData.includes("id=")) {
                const urlParams = new URLSearchParams(qrData.split("?")[1]);
                aadhaarId = urlParams.get("id") || aadhaarId;
            } else if (qrData.includes("/")) {
                const parts = qrData.split("/");
                aadhaarId = parts[parts.length - 1];
            }

            const res = await fetch(`http://localhost:8000/api/users/by-aadhaar/${aadhaarId}`);
            if (!res.ok) throw new Error("User not found");
            const data = await res.json();
            if (data && data.length > 0) {
                setUserData(data[0]);
            } else {
                throw new Error("User not found in the database");
            }
        } catch (err) {
            setError(err.message || "Failed to verify identity");
        } finally {
            setLoading(false);
            setScanning(false);
        }
    };

    useEffect(() => {
        if (scanning && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(err => console.error("Error playing video:", err));
            requestAnimationFrame(tick);
        }
    }, [scanning]);

    const startWebcamScan = async () => {
        setError(null);
        setScanResult(null);
        setUserData(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            setScanning(true);
        } catch (err) {
            setError("Unable to access webcam: " + err.message);
        }
    };

    const tick = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code) {
                stopWebcam();
                setScanResult(code.data);
                fetchUserData(code.data);
                return; // Stop loop
            }
        }
        
        if (streamRef.current) {
            requestAnimationFrame(tick);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 fade-in">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">QR Code Scanner</h1>
                <p className="text-gray-500 mt-2">Scan worker's Digital Health ID for instant verification</p>
            </div>

            {!userData && (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Webcam Area */}
                    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center min-h-[300px] border-4 border-gray-800">
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {scanning ? (
                            <>
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="w-full h-1 bg-green-500 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#22c55e]"></div>
                                    <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-green-500"></div>
                                    <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-green-500"></div>
                                    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-green-500"></div>
                                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-green-500"></div>
                                </div>
                                <button 
                                    onClick={stopWebcam} 
                                    className="absolute bottom-4 bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded shadow text-sm font-medium transition"
                                >
                                    Stop Camera
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="text-gray-500 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <button onClick={startWebcamScan} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded shadow transition">
                                    Start Camera
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Drop Zone Area */}
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-green-50 hover:border-green-400 transition"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <div className="text-4xl mb-4">📁</div>
                        <h3 className="font-bold text-gray-700">Upload QR Image</h3>
                        <p className="text-sm text-gray-500 mt-2">Drag and drop an image of the QR code, or click to browse.</p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                        />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="mt-6 bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded shadow-sm hover:bg-gray-50 transition"
                        >
                            Browse Files
                        </button>
                    </div>
                </div>
            )}

            {loading && <div className="text-center text-blue-600 font-bold animate-pulse">Verifying Identity...</div>}
            
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded shadow-sm">
                    <strong>Error: </strong> {error}
                </div>
            )}

            {userData && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="bg-white text-green-600 p-2 rounded-full shadow">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </span>
                            <h2 className="text-2xl font-bold">Identity Verified</h2>
                        </div>
                        <span className="text-green-100 text-sm font-medium">Govt. App ID: {userData.aadhaarNumber.slice(-4)}</span>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center gap-6 border-b border-gray-100 pb-6">
                            <img 
                                src={userData.profilePicBase64 || "/sample_profile.png"} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white"
                            />
                            <div>
                                <h3 className="text-2xl font-black text-gray-800">{userData.name}</h3>
                                <p className="text-gray-500 font-medium">Age: {userData.age} • Blood: {userData.blood_group}</p>
                                <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                    {userData.destinationDistrict}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Vaccination</span>
                                <div className="font-medium text-gray-800">
                                    {userData.records?.vaccination1 ? "✅ Dose 1" : "❌ Dose 1"}<br/>
                                    {userData.records?.vaccination2 ? "✅ Dose 2" : "❌ Dose 2"}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Health Notes</span>
                                <div className="font-medium text-gray-800 truncate">
                                    {userData.records?.specialNotes || "None"}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setUserData(null)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition"
                        >
                            Scan Another Card
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            `}} />
        </div>
    );
}
