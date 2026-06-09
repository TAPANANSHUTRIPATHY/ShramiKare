import React, { useState, useEffect } from "react";
import axios from "axios";

const baseURL = "http://localhost:8000/api";

export default function DigitalHealthIdPage({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrHtml, setQrHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${baseURL}/users/by-aadhaar/${userId}`);
        setUser(res.data[0]);
      } catch (err) {
        setError("Could not load user details.");
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchUser();
  }, [userId]);

  useEffect(() => {
    async function fetchQr() {
      if (!userId) return;
      try {
        const qrRes = await axios.get(
          `${baseURL}/generate-qr/?text=${baseURL}/users/by-aadhaar/${userId}`,
          { responseType: "text" }
        );
        setQrHtml(qrRes.data);
      } catch {
        setQrHtml("");
      }
    }
    fetchQr();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-green-700 text-lg">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-green-800 text-center mb-2">
          Digital Health ID Card
        </h1>
        <p className="text-center text-green-700 mb-6">
          Your official digital health identification
        </p>

        {/* ID Card Section */}
        <div className="bg-green-700 rounded-t-xl p-7">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-start gap-2 flex-1">
              <span className="text-white font-bold">ShramiKare</span>
              <span className="text-white text-sm opacity-80">Digital Health Record System</span>
            </div>
            <div className="flex flex-1 justify-end">
              <span className="text-white text-sm">
                State of Kerala<br />
                Govt. of India
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow p-7 flex flex-col md:flex-row items-center justify-between">
          {/* Left Profile and Info */}
          <div className="flex items-center gap-6 flex-1">
            <div>
              <div className="rounded-full w-40 h-40 bg-green-200 overflow-hidden mb-4">
                {user?.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt="User"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <img
                    src="https://avatar.iran.liara.run/public"
                    alt="Default Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </div>

              <div className="flex flex-col items-center">
                <div className="font-bold text-xl text-green-800">{user.name}</div>
                <div className="text-green-700 text-sm mb-1">
                  <span>Age: {user.age || "N/A"}</span> · Since: {user.records?.registrationDate || "N/A"}
                </div>
                <div className="inline-block  bg-green-600 text-white text-xs px-2 py-1 rounded-full mb-2">
                  Aadhaar Verified
                </div>
              </div>
            </div>
          </div>

          {/* Right QR and Meta */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div dangerouslySetInnerHTML={{ __html: qrHtml }} />
            <div className="mt-2 text-green-800 text-xs text-center">
              QR Code
              <br />
              Scan for instant verification
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mt-8 ">
          <h3 className="text-green-800 font-semibold mb-4">Health & Employment Details</h3>
          {user ? (
            <>
              <div className="mb-6">
                <h4 className="font-semibold text-green-700 mb-2">Health Records</h4>
                <p>
                  <strong>Vaccinations:</strong>{" "}
                  {user.records?.vaccination1 ? "Dose 1" : "None"},{" "}
                  {user.records?.vaccination2 ? "Dose 2" : "None"}
                </p>
                <p>
                  <strong>Special Notes:</strong>{" "}
                  {user.records?.specialNotes ?? "None"}
                </p>
                <p>
                  <strong>Last Visit Reason:</strong>{" "}
                  {user.records?.lastVisitReason ?? "N/A"}
                </p>
                <p>
                  <strong>Last Visit Date:</strong>{" "}
                  {user.records?.lastVisitDate ?? "N/A"}
                </p>
                <p>
                  <strong>Visit Location:</strong>{" "}
                  {user.records?.visitLocation ?? "N/A"}
                </p>
                <p>
                  <strong>Current Symptoms:</strong>{" "}
                  {Array.isArray(user.records?.currentSymptoms) &&
                  user.records.currentSymptoms.length > 0
                    ? user.records.currentSymptoms.join(", ")
                    : "None"}
                </p>
                <p>
                  <strong>Next Follow Up Date:</strong>{" "}
                  {user.records?.nextFollowUpDate ?? "N/A"}
                </p>
                <p>
                  <strong>Outbreak Flag:</strong>{" "}
                  {user.records?.outbreakFlag ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Employment History</h4>
                {Array.isArray(user.companies) && user.companies.length > 0 ? (
                  user.companies.map((company, idx) => (
                    <div key={idx} className="mb-3">
                      <p>
                        <strong>Company Name:</strong> {company.name ?? "N/A"}
                      </p>
                      <p>
                        <strong>From:</strong> {company.from ?? "N/A"}
                      </p>
                      <p>
                        <strong>To:</strong> {company.to ?? "Present"}
                      </p>
                      <p>
                        <strong>Working:</strong> {company.working ? "Yes" : "No"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No employment data available.</p>
                )}
              </div>
            </>
          ) : (
            <p>No user details available.</p>
          )}
        </div>


        <div className="bg-white rounded-xl shadow p-7 mt-2 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-green-800 font-medium">Worker ID:</div>
            <div className="mb-2">{user.workerId || "SHR/2025/001234"}</div>
            <div className="text-green-800 font-medium">Health Status:</div>
            <div
              className={`mb-2 font-bold ${
                user.records?.healthStatus === "Active" ? "text-green-600" : "text-red-600"
              }`}
            >
              {user.records?.healthStatus || "Active"}
            </div>
            <div className="text-green-800 font-medium">Identity Status:</div>
            <div className="mb-2 font-bold text-green-600">Verified</div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-600 transition">
            <span className="inline-flex items-center gap-2">
              {/* SVG for Download */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17L12 21M12 21L16 17M12 21V3" />
              </svg>
              Download PDF
            </span>
          </button>
          <button className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-semibold shadow border border-green-300 hover:bg-green-200 transition">
            <span className="inline-flex items-center gap-2">
              {/* SVG for Share */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 8A5 5 0 0 1 11 13a5 5 0 0 1-4-5V7a5 5 0 0 1 10 0v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7"
                ></path>
              </svg>
              Share ID
            </span>
          </button>
        </div>

        {/* Important Information Section */}
        <div className="bg-green-100 rounded-xl shadow p-6 mt-8">
          <h3 className="font-semibold text-green-700 mb-3">Important Information</h3>
          <ul className="space-y-2 text-green-700 text-base">
            <li>✅ This digital ID is valid for all healthcare services in Kerala</li>
            <li>✅ Keep this ID handy during medical visits and health checkups</li>
            <li>✅ QR code enables quick verification by healthcare providers</li>
            <li>✅ Report any discrepancies immediately to local authorities</li>
          </ul>
        </div>
        
      </main>
    </div>
  );
}
