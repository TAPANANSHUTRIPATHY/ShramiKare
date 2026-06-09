import React, { useState } from "react";

const districts = [
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasargode", "Kollam",
  "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
  "Thiruvananthapuram", "Thrissur", "Wayanad"
];

const baseURL = "http://127.0.0.1:8000/api" //process.env.REACT_APP_API_BASE_URL

export default function DoctorDetailsPage() {
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState("");

  const fetchFacilities = async () => {
    setLoading(true);
    setError("");
    setFacilities([]);
    try {
      const res = await fetch(`${baseURL}/facilities/?district=${district}`);
      if (!res.ok) throw new Error("Failed to fetch facilities");
      const data = await res.json();
      // Convert response object to array
      const facilityArr = Object.values(data);
      setFacilities(facilityArr);
    } catch (e) {
      setError("Could not fetch facilities. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <main className="max-w-6xl mx-auto py-14 px-4">
        <h1 className="text-3xl font-bold text-green-800 text-center mb-2">
          Healthcare Provider Details
        </h1>
        <p className="text-center text-green-700 mb-6">
          Register healthcare professionals and facilities. Select your district to view available providers.
        </p>

        {/* District Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <label className="font-medium text-green-800 mb-2 sm:mb-0" htmlFor="district-select">
            Choose District:
          </label>
          <select
            id="district-select"
            className="border border-green-300 rounded px-4 py-2 bg-white text-green-800 w-full sm:w-auto"
            value={district}
            onChange={e => setDistrict(e.target.value)}
          >
            <option value="">Select district...</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            className="bg-green-700 text-white rounded px-5 py-2 font-semibold shadow hover:bg-green-600 transition w-full sm:w-auto mt-2 sm:mt-0"
            disabled={!district || loading}
            onClick={fetchFacilities}
          >
            {loading ? "Loading..." : "Show Providers"}
          </button>
        </div>
        {/* Registered Providers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {error && (
            <div className="col-span-2 text-red-700 bg-red-50 rounded p-4">
              {error}
            </div>
          )}
          {!facilities.length && !error && (
            <div className="col-span-2 text-green-700 bg-green-100 rounded p-4 text-center">
              No healthcare providers registered yet. Select a district and try again.
            </div>
          )}
          {facilities.map((facility, idx) => (
            <div key={idx} className="bg-white shadow rounded-xl p-6">
              <h3 className="font-bold text-xl text-green-800 mb-2">{facility.facilityName || "Facility"}</h3>
              <div className="text-green-600 text-sm mb-2">
                <span className="font-medium">{facility.facilityType}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Address:</span> {facility.address}
              </div>
              <div className="mb-2">
                <span className="font-medium">Contact:</span>{" "}
                {facility.phoneNumbers && facility.phoneNumbers.length > 0
                  ? facility.phoneNumbers.join(", ")
                  : "N/A"}
              </div>
              <div className="mb-2">
                <span className="font-medium">Working Hours:</span> {facility.workingHours || "N/A"}
              </div>
              <div className="mt-2">
                <span className="font-medium">Services:</span>{" "}
                {facility.services && facility.services.length > 0
                  ? facility.services.join(", ")
                  : "N/A"}
              </div>
              <div className="mt-2 text-green-700 italic">{facility.remarks}</div>
            </div>
          ))}
        </div>
      </main>
      
    </div>
  );
}
