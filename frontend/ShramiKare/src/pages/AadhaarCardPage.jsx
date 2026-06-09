import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DEMO_USER_ID, DEMO_USER_DATA } from "../demoData";

const baseURL = "http://127.0.0.1:8000/api"//process.env.REACT_APP_API_BASE_URL

export default function AadhaarCardPage({ userId: propUserId }) {
  // Check localStorage if prop is empty
  const userId = propUserId || localStorage.getItem("userId");

  const [aadhaarImgUrl, setAadhaarImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    async function fetchAadhaarImage() {
      setLoading(true);
      setError("");
      setUsingDemo(false);

      // If demo mode, use demo data directly
      if (userId === DEMO_USER_ID) {
        setAadhaarImgUrl(DEMO_USER_DATA.records.aadhaarImageUrl || "/sample_aadhar.png");
        setUsingDemo(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseURL}/users/id/${userId}`);
        const data = await res.json();
        const imgUrl = data.records?.aadhaarImageUrl;
        if (imgUrl) setAadhaarImgUrl(imgUrl);
        else setError("No Aadhaar image uploaded.");
      } catch {
        // Fallback to demo
        setAadhaarImgUrl("/sample_aadhar.png");
        setUsingDemo(true);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchAadhaarImage();
    else setLoading(false);
  }, [userId]);

  return (
    <div className="min-h-screen bg-green-50">
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-green-800 text-center mb-2">
          My Aadhaar Card
        </h1>
        <p className="text-center text-green-700 mb-6">
          View your Aadhaar card image for identity verification.
        </p>

        {/* Demo mode banner */}
        {usingDemo && (
          <div className="bg-blue-50 border border-blue-300 text-blue-700 rounded-lg p-3 mb-6 text-center text-sm">
            🧪 <strong>Demo Mode:</strong> Showing sample Aadhaar card. Backend is unavailable.
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center min-h-[320px]">
          {loading ? (
            <div className="text-green-700 text-lg">Loading...</div>
          ) : aadhaarImgUrl ? (
            <img
              src={aadhaarImgUrl}
              alt="Aadhaar Card"
              className="rounded-lg max-h-72 shadow"
              onError={e => {
                e.target.onerror = null;
                e.target.src = "/sample_aadhar.png"
              }}
            />
          ) : (
            <>
              <img
                src="/sample_aadhar.png"
                alt="Sample Aadhaar Card"
                className="rounded-lg max-h-72 shadow mb-4"
              />
              {/* <div className="text-red-600 bg-red-50 rounded p-4 text-center font-semibold">
                {error || "Aadhaar card image not available."}
              </div> */}
            </>
          )}
        </div>

        <div className="bg-green-100 rounded-xl shadow p-6 mt-8">
          <h3 className="font-semibold text-green-700 mb-3">Review Aadhaar Card</h3>
          <ul className="space-y-2 text-green-700 text-base">
            <li>👁️ Confirm the Aadhaar card image is clearly visible and not cropped</li>
            <li>🔍 Verify that all text and numbers are legible and match the user's profile</li>
            <li>🧾 Check for authenticity markers like QR code and government seal</li>
            <li>📅 Ensure the document is current and not expired (if applicable)</li>
            <li>🛡️ Report any discrepancies or unclear images for re-upload</li>
            <li>
              🔐 <span className="font-semibold">Note:</span> If no Aadhaar card is displayed, please{" "}
              <Link to="/login" className="text-blue-600 underline hover:text-blue-800 font-semibold">
                log in
              </Link>{" "}
              to view your identity document
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
