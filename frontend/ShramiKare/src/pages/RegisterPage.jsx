import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    blood_group: "",
    language: "en",
    gender: "",
    address: "",
    aadhaarNumber: "",
    phonenumber: "",
    originState: "",
    originDistrict: "",
    destinationDistrict: "",
    records: {
      vaccination1: false,
      vaccination2: false,
      specialNotes: "",
      lastVisitReason: "",
      lastVisitDate: "",
      visitLocation: "",
      currentSymptoms: [],
      nextFollowUpDate: "",
      reminderStatus: "",
      outbreakFlag: false,
    },
    companies: [{ name: "", from: "", to: "", working: false }],
    profilePhoto: null,
    aadhaarPhoto: null,
  });

  const [previews, setPreviews] = useState({ profilePhoto: "", aadhaarPhoto: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrError, setOcrError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("records.")) {
      const key = name.split(".")[1];
      setForm(prev => ({ ...prev, records: { ...prev.records, [key]: type === "checkbox" ? checked : value } }));
    } else if (name.startsWith("companies[0].")) {
      const key = name.match(/companies\[0\]\.(.*)/)[1];
      setForm(prev => ({ ...prev, companies: [{ ...prev.companies[0], [key]: type === "checkbox" ? checked : value }] }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  }

  function handleSymptomsChange(e) {
    const { value, checked } = e.target;
    let updatedSymptoms = [...form.records.currentSymptoms];
    if (checked) updatedSymptoms.push(value);
    else updatedSymptoms = updatedSymptoms.filter(item => item !== value);
    setForm(prev => ({ ...prev, records: { ...prev.records, currentSymptoms: updatedSymptoms } }));
  }

  function handleFileChange(e) {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      setForm(prev => ({ ...prev, [name]: file }));
      setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
    }
  }

  async function handleOcrUpload(file) {
    setOcrScanning(true);
    setOcrError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE_URL}/ocr-aadhaar/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { name, age, aadhaar_number, gender } = res.data;
      setForm(prev => ({
        ...prev,
        name: name || prev.name,
        age: age || prev.age,
        aadhaarNumber: aadhaar_number || prev.aadhaarNumber,
        gender: gender ? gender.charAt(0).toUpperCase() : prev.gender
      }));
      setShowOcrModal(false);
    } catch (error) {
      setOcrError("Failed to parse Aadhaar card. Please try again or enter manually.");
    } finally {
      setOcrScanning(false);
    }
  }

  function handleMockOcr(type) {
    setOcrScanning(true);
    setOcrError("");
    setTimeout(() => {
      if (type === "rajesh") {
        setForm(prev => ({ ...prev, name: "Rajesh Kumar", age: "32", aadhaarNumber: "789456123012", gender: "M" }));
      } else {
        setForm(prev => ({ ...prev, name: "Priya Sharma", age: "28", aadhaarNumber: "456123789045", gender: "F" }));
      }
      setOcrScanning(false);
      setShowOcrModal(false);
    }, 1500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSuccess("");

    // Build JSON payload (excluding file fields for now)
    const payload = {
      name: form.name,
      age: parseInt(form.age),
      blood_group: form.blood_group,
      language: form.language,
      gender: form.gender,
      address: form.address,
      aadhaarNumber: form.aadhaarNumber,
      phonenumber: parseInt(form.phonenumber),
      originState: form.originState,
      originDistrict: form.originDistrict,
      destinationDistrict: form.destinationDistrict,
      records: form.records,
      companies: form.companies,
      profilePhotoUrl: "https://avatar.iran.liara.run/public/",
      aadhaarPhotoUrl: "/sample_aadhar.png",
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/users/`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.data && res.data.id) {
        setSuccess(`Registration successful! Your ID: ${res.data.id}`);
        // Store userId and redirect
        localStorage.setItem("userId", form.aadhaarNumber);
        setTimeout(() => { window.location.href = "/digital-id"; }, 2000);
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Registration failed";
      setErrors({ form: msg });
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-900 mb-8 text-center">
        Migrant Worker Registration
      </h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-800 rounded-lg p-4 mb-6 text-center font-semibold">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow grid grid-cols-1 gap-6">
        {/* Basic Details */}
        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required className="border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="age">Age</label>
            <input type="number" id="age" name="age" value={form.age} onChange={handleChange} required min={1} max={120} className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={form.gender} onChange={handleChange} required className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="blood_group">Blood Group</label>
          <input type="text" id="blood_group" name="blood_group" value={form.blood_group} onChange={handleChange} placeholder="e.g. A+, B-, O+" className="border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="language">Language</label>
          <select id="language" name="language" value={form.language} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="en">English</option>
            <option value="ml">Malayalam</option>
            <option value="hi">Hindi</option>
            <option value="or">Odia</option>
            <option value="as">Assamese</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="address">Address</label>
          <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={3} className="border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="font-semibold text-green-700" htmlFor="aadhaarNumber">Aadhaar Number</label>
              <button type="button" onClick={() => setShowOcrModal(true)} className="text-sm bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded font-medium flex items-center gap-1 transition">
                📸 Scan Auto-Fill
              </button>
            </div>
            <input type="text" id="aadhaarNumber" name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} placeholder="xxxx-xxxx-xxxx" className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400" required />
          </div>
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="phonenumber">Phone Number</label>
            <input type="tel" id="phonenumber" name="phonenumber" value={form.phonenumber} onChange={handleChange} placeholder="xxxxxxxxxx" className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400" required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="originState">Origin State</label>
            <input type="text" id="originState" name="originState" value={form.originState} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="originDistrict">Origin District</label>
            <input type="text" id="originDistrict" name="originDistrict" value={form.originDistrict} onChange={handleChange} placeholder="e.g. Cuttack" className="border border-green-300 rounded px-3 py-2 w-full" required />
          </div>
        </div>

        <div className="flex flex-col mb-6">
          <label className="font-semibold text-green-700 mb-1" htmlFor="destinationDistrict">Destination District</label>
          <input type="text" id="destinationDistrict" name="destinationDistrict" value={form.destinationDistrict} onChange={handleChange} placeholder="e.g. Ernakulam" className="border border-green-300 rounded px-3 py-2 w-full" required />
        </div>

        {/* Health Records */}
        <fieldset className="border border-green-300 rounded p-4 grid gap-4 mb-6">
          <legend className="font-semibold text-green-800 mb-2">Health Records</legend>
          <div className="flex items-center space-x-4">
            <input type="checkbox" id="vaccination1" name="records.vaccination1" checked={form.records.vaccination1} onChange={handleChange} />
            <label htmlFor="vaccination1" className="text-green-700">Vaccination Dose 1</label>
          </div>
          <div className="flex items-center space-x-4">
            <input type="checkbox" id="vaccination2" name="records.vaccination2" checked={form.records.vaccination2} onChange={handleChange} />
            <label htmlFor="vaccination2" className="text-green-700">Vaccination Dose 2</label>
          </div>
          <div>
            <label htmlFor="specialNotes" className="block font-semibold text-green-700 mb-1">Special Notes</label>
            <textarea id="specialNotes" name="records.specialNotes" rows={2} value={form.records.specialNotes} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label htmlFor="lastVisitReason" className="block font-semibold text-green-700 mb-1">Last Visit Reason</label>
            <input type="text" id="lastVisitReason" name="records.lastVisitReason" value={form.records.lastVisitReason} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label htmlFor="lastVisitDate" className="block font-semibold text-green-700 mb-1">Last Visit Date</label>
            <input type="date" id="lastVisitDate" name="records.lastVisitDate" value={form.records.lastVisitDate} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label htmlFor="visitLocation" className="block font-semibold text-green-700 mb-1">Visit Location</label>
            <input type="text" id="visitLocation" name="records.visitLocation" value={form.records.visitLocation} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label htmlFor="nextFollowUpDate" className="block font-semibold text-green-700 mb-1">Next Follow Up Date</label>
            <input type="date" id="nextFollowUpDate" name="records.nextFollowUpDate" value={form.records.nextFollowUpDate} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
          </div>
        </fieldset>

        {/* Current Symptoms */}
        <fieldset className="border border-green-300 rounded p-4 mb-6">
          <legend className="font-semibold text-green-800 mb-2">Current Symptoms</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["fever", "cough", "cold", "headache", "body pain", "weakness", "breathing difficulty", "None"].map(symptom => (
              <label key={symptom} className="inline-flex items-center space-x-2">
                <input type="checkbox" value={symptom} checked={form.records.currentSymptoms.includes(symptom)} onChange={handleSymptomsChange} className="form-checkbox" />
                <span className="text-green-700 capitalize">{symptom}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Employment */}
        <fieldset className="border border-green-300 rounded p-4 grid gap-4 mb-6">
          <legend className="font-semibold text-green-800 mb-2">Employment History</legend>
          <div>
            <label htmlFor="companyName" className="block font-semibold text-green-700 mb-1">Company Name</label>
            <input type="text" id="companyName" name="companies[0].name" value={form.companies[0].name} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" placeholder="e.g. DEF Industries" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyFrom" className="block font-semibold text-green-700 mb-1">From</label>
              <input type="date" id="companyFrom" name="companies[0].from" value={form.companies[0].from} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label htmlFor="companyTo" className="block font-semibold text-green-700 mb-1">To</label>
              <input type="date" id="companyTo" name="companies[0].to" value={form.companies[0].to} onChange={handleChange} className="border border-green-300 rounded px-3 py-2 w-full" />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <input type="checkbox" id="companyWorking" name="companies[0].working" checked={form.companies[0].working} onChange={handleChange} />
            <label htmlFor="companyWorking" className="text-green-700 font-semibold">Currently Working</label>
          </div>
        </fieldset>

        {/* File Uploads */}
        <fieldset className="border border-green-300 rounded p-4 mb-6">
          <legend className="text-green-800 font-semibold mb-3">Upload Documents</legend>
          <div className="mb-4">
            <label htmlFor="aadhaarPhoto" className="block font-semibold text-green-700 mb-1">Aadhaar Card Photo</label>
            <input type="file" id="aadhaarPhoto" name="aadhaarPhoto" accept=".jpg,.jpeg,.png" onChange={handleFileChange} className="text-green-700 w-full" />
          </div>
          <div className="mb-4">
            <label htmlFor="profilePhoto" className="block font-semibold text-green-700 mb-1">Profile Photo</label>
            <input type="file" id="profilePhoto" name="profilePhoto" accept=".jpg,.jpeg,.png" onChange={handleFileChange} className="text-green-700 w-full" />
            {previews.profilePhoto && <img src={previews.profilePhoto} alt="Profile Preview" className="mt-2 max-h-24 rounded shadow" />}
          </div>
        </fieldset>

        {errors.form && <div className="text-red-600 font-semibold mb-4">{errors.form}</div>}
        <button type="submit" disabled={submitting} className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow">
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>

      {/* OCR Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowOcrModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Scan Aadhaar Card</h2>
            <p className="text-gray-600 text-sm mb-6">Upload a photo of your Aadhaar card to auto-fill the registration form using AI Vision.</p>
            
            <div className="space-y-4">
              <label className="block w-full border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 rounded-lg p-6 text-center cursor-pointer transition">
                <span className="text-4xl mb-2 block">📷</span>
                <span className="font-medium text-green-800">{ocrScanning ? "Analyzing..." : "Click to Upload Image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files[0]) handleOcrUpload(e.target.files[0]);
                }} disabled={ocrScanning} />
              </label>

              {ocrError && <div className="text-red-500 text-sm font-medium text-center">{ocrError}</div>}

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-500 font-medium">OR USE MOCK DATA</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleMockOcr("rajesh")} disabled={ocrScanning} className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded font-medium text-sm transition">
                  Rajesh Kumar (M)
                </button>
                <button type="button" onClick={() => handleMockOcr("priya")} disabled={ocrScanning} className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded font-medium text-sm transition">
                  Priya Sharma (F)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
