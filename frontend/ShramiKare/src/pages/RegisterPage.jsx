import React, { useState } from "react";

const baseURL = "http://127.0.0.1:8000/api"//process.env.REACT_APP_API_BASE_URL

export default function RegisterPage() {
// Add profilePhoto to state
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
    companies: [
        {
            name: "",
            from: "",
            to: "",
            working: false,
        },
    ],
    profilePhoto: null,
    aadhaarPhoto: null,
    passportPhoto: null,
});

// Add preview URLs state
const [previews, setPreviews] = useState({
    profilePhoto: "",
    aadhaarPhoto: "",
    passportPhoto: "",
});

// Modify handleFileChange:
function handleFileChange(e) {
    const { name, files } = e.target;
    if (files.length > 0) {
        const file = files[0];
        setForm((prev) => ({
            ...prev,
            [name]: file,
        }));
        const previewURL = URL.createObjectURL(file);
        setPreviews((prev) => ({
            ...prev,
            [name]: previewURL,
        }));
    }
}

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("records.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        records: {
          ...prev.records,
          [key]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.startsWith("companies[0].")) {
      const key = name.match(/companies\[0\]\.(.*)/)[1];
      setForm((prev) => ({
        ...prev,
        companies: [
          {
            ...prev.companies[0],
            [key]: type === "checkbox" ? checked : value,
          },
        ],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  }

  function handleSymptomsChange(e) {
    const { value, checked } = e.target;
    let updatedSymptoms = [...form.records.currentSymptoms];
    if (checked) {
      updatedSymptoms.push(value);
    } else {
      updatedSymptoms = updatedSymptoms.filter((item) => item !== value);
    }
    setForm((prev) => ({
      ...prev,
      records: { ...prev.records, currentSymptoms: updatedSymptoms },
    }));
  }

  function handleFileChange(e) {
    const { name, files } = e.target;
    if (files.length > 0) {
      setForm((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    // Build FormData to allow file uploads
    let formData = new FormData();

    // Append simple fields
    for (const key in form) {
      if (
        typeof form[key] !== "object" ||
        form[key] instanceof File ||
        form[key] === null
      ) {
        if (form[key] !== null) formData.append(key, form[key]);
      } else {
        // For objects serialize to JSON strings
        formData.append(key, JSON.stringify(form[key]));
      }
    }

    try {
    const res = await axios.post(`${baseURL}/users/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
      if (res.ok) {
        alert("Registration successful");
        // Reset form or redirect as needed
      } else {
        const data = await res.json();
        setErrors({ form: data.error || "Registration failed" });
      }
    } catch (error) {
      setErrors({ form: "Network error" });
    }

    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-900 mb-8 text-center">
        Migrant Worker Registration
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow grid grid-cols-1 gap-6">
        {/* Basic Details */}
        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="name">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="age">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={form.age}
              onChange={handleChange}
              required
              min={1}
              max={120}
              className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="blood_group">
            Blood Group
          </label>
          <input
            type="text"
            id="blood_group"
            name="blood_group"
            value={form.blood_group}
            onChange={handleChange}
            placeholder="e.g. A+, B-, O+"
            className="border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="language">
            Language
          </label>
          <select
            id="language"
            name="language"
            value={form.language}
            onChange={handleChange}
            className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="en">English</option>
            <option value="ml">Malayalam</option>
            <option value="hi">Hindi</option>
            <option value="or">Odia</option>
            <option value="as">Assamese</option>
            {/* add other languages */}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-semibold text-green-700 mb-1" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={3}
            className="border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="aadhaarNumber">
              Aadhaar Number
            </label>
            <input
              type="text"
              id="aadhaarNumber"
              name="aadhaarNumber"
              value={form.aadhaarNumber}
              onChange={handleChange}
              placeholder="xxxx-xxxx-xxxx"
              className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="phonenumber">
              Phone Number
            </label>
            <input
              type="tel"
              id="phonenumber"
              name="phonenumber"
              value={form.phonenumber}
              onChange={handleChange}
              placeholder="xxxxxxxxxx"
              className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="originState">
              Origin State
            </label>
            <input
              type="text"
              id="originState"
              name="originState"
              value={form.originState}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="font-semibold text-green-700 mb-1" htmlFor="originDistrict">
              Origin District
            </label>
            <input
              type="text"
              id="originDistrict"
              name="originDistrict"
              value={form.originDistrict}
              onChange={handleChange}
              placeholder="e.g. Cuttack"
              className="border border-green-300 rounded px-3 py-2 w-full"
              required
            />
          </div>
        </div>

        <div className="flex flex-col mb-6">
          <label className="font-semibold text-green-700 mb-1" htmlFor="destinationDistrict">
            Destination District
          </label>
          <input
            type="text"
            id="destinationDistrict"
            name="destinationDistrict"
            value={form.destinationDistrict}
            onChange={handleChange}
            placeholder="e.g. Ernakulam"
            className="border border-green-300 rounded px-3 py-2 w-full"
            required
          />
        </div>

        {/* Health Records */}
        <fieldset className="border border-green-300 rounded p-4 grid gap-4 mb-6">
          <legend className="font-semibold text-green-800 mb-2">Health Records</legend>

          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="vaccination1"
              name="records.vaccination1"
              checked={form.records.vaccination1}
              onChange={handleChange}
            />
            <label htmlFor="vaccination1" className="text-green-700">
              Vaccination Dose 1
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="vaccination2"
              name="records.vaccination2"
              checked={form.records.vaccination2}
              onChange={handleChange}
            />
            <label htmlFor="vaccination2" className="text-green-700">
              Vaccination Dose 2
            </label>
          </div>

          <div>
            <label htmlFor="specialNotes" className="block font-semibold text-green-700 mb-1">
              Special Notes
            </label>
            <textarea
              id="specialNotes"
              name="records.specialNotes"
              rows={2}
              value={form.records.specialNotes}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label htmlFor="lastVisitReason" className="block font-semibold text-green-700 mb-1">
              Last Visit Reason
            </label>
            <input
              type="text"
              id="lastVisitReason"
              name="records.lastVisitReason"
              value={form.records.lastVisitReason}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label htmlFor="lastVisitDate" className="block font-semibold text-green-700 mb-1">
              Last Visit Date
            </label>
            <input
              type="date"
              id="lastVisitDate"
              name="records.lastVisitDate"
              value={form.records.lastVisitDate}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label htmlFor="visitLocation" className="block font-semibold text-green-700 mb-1">
              Visit Location
            </label>
            <input
              type="text"
              id="visitLocation"
              name="records.visitLocation"
              value={form.records.visitLocation}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label htmlFor="nextFollowUpDate" className="block font-semibold text-green-700 mb-1">
              Next Follow Up Date
            </label>
            <input
              type="date"
              id="nextFollowUpDate"
              name="records.nextFollowUpDate"
              value={form.records.nextFollowUpDate}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label htmlFor="outbreakFlag" className="inline-flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="outbreakFlag"
                name="records.outbreakFlag"
                checked={form.records.outbreakFlag}
                onChange={handleChange}
              />
              <span className="text-green-700 font-semibold">Outbreak Flag</span>
            </label>
          </div>
        </fieldset>

        {/* Current Symptoms Checkboxes */}
        <fieldset className="border border-green-300 rounded p-4 mb-6">
          <legend className="font-semibold text-green-800 mb-2">Current Symptoms</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "fever",
              "cough",
              "cold",
              "headache",
              "body pain",
              "weakness",
              "breathing difficulty",
              "None"
            ].map((symptom) => (
              <label key={symptom} className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={symptom}
                  checked={form.records.currentSymptoms.includes(symptom)}
                  onChange={handleSymptomsChange}
                  className="form-checkbox"
                />
                <span className="text-green-700 capitalize">{symptom}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Employment History */}
        <fieldset className="border border-green-300 rounded p-4 grid gap-4 mb-6">
          <legend className="font-semibold text-green-800 mb-2">Employment History (Current & Previous)</legend>
          <div>
            <label htmlFor="companyName" className="block font-semibold text-green-700 mb-1">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companies[0].name"
              value={form.companies[0].name}
              onChange={handleChange}
              className="border border-green-300 rounded px-3 py-2 w-full"
              placeholder="e.g. DEF Industries"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyFrom" className="block font-semibold text-green-700 mb-1">From</label>
              <input
                type="date"
                id="companyFrom"
                name="companies[0].from"
                value={form.companies[0].from}
                onChange={handleChange}
                className="border border-green-300 rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="companyTo" className="block font-semibold text-green-700 mb-1">To</label>
              <input
                type="date"
                id="companyTo"
                name="companies[0].to"
                value={form.companies[0].to}
                onChange={handleChange}
                className="border border-green-300 rounded px-3 py-2 w-full"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="companyWorking"
              name="companies[0].working"
              checked={form.companies[0].working}
              onChange={handleChange}
            />
            <label htmlFor="companyWorking" className="text-green-700 font-semibold">Currently Working</label>
          </div>
        </fieldset>

        {/* Aadhaar and Passport Upload */}
        <div className="w-full max-w-screen-sm px-4 mx-auto">
  <fieldset className="border border-green-300 rounded p-4 mb-6 overflow-x-auto">
    <legend className="text-green-800 font-semibold mb-3 text-base sm:text-lg">Upload Identity Documents</legend>

    <div className="mb-4">
      <label
        htmlFor="aadhaarPhoto"
        className="block font-semibold text-green-700 mb-1 text-sm sm:text-base"
      >
        Aadhaar Card Photo (JPEG/PNG, max 5MB)
      </label>
      <input
        type="file"
        id="aadhaarPhoto"
        name="aadhaarPhoto"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="text-green-700 w-full"
      />
    </div>
    <div className="mb-4">
        <label
            htmlFor="profilePhoto"
            className="block font-semibold text-green-700 mb-1 text-sm sm:text-base"
        >
            Profile Photo (JPEG/PNG, max 5MB)
        </label>
        <input
            type="file"
            id="profilePhoto"
            name="profilePhoto"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="text-green-700 w-full"
        />
        {previews.profilePhoto && (
            <img
                src={previews.profilePhoto}
                alt="Profile Preview"
                className="mt-2 max-h-24 rounded shadow"
            />
        )}
    </div>
  </fieldset>
</div>


        {/* Submit Button */}
        {errors.form && <div className="text-red-600 font-semibold mb-4">{errors.form}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow"
        >
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
