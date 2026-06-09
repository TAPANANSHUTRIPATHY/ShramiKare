import React, { useState } from "react";

const baseURL = "http://127.0.0.1:8000/api"

export default function OtpLoginPage() {
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(""); // Store for step 2
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle initial submit to request OTP
  const handleSubmitId = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Assume mobile or aadhaar goes as user_id in API
      const res = await fetch(`${baseURL}/otp/generate/`, {
        method: "POST",
        body: new URLSearchParams({ user_id: inputValue }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      if (data.message === "OTP generated") {
        setUserId(inputValue);
        setStep(2);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP submit for verification
  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/otp/validate/`, {
        method: "POST",
        body: new URLSearchParams({ user_id: userId, otp }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      if (data.message === "OTP validated") {
        // redirect or set authenticated
        window.location.href = "/digital-id";
      } else {
        setError(data.error || "Incorrect OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <main className="flex flex-col items-center justify-center py-20">
        <div className="bg-green-100 rounded-xl shadow-lg w-full max-w-md px-8 py-10">
          <div className="flex flex-col items-center mb-8">
            <div className="rounded-full p-3 mb-3">
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
            <h1 className="text-2xl text-green-800 font-bold">ShramiKare</h1>
            <p className="text-green-700">Care for the hands that build</p>
          </div>
          <h2 className="font-semibold text-green-700 text-center mb-6 text-xl">
            Welcome Back
          </h2>

          {/* Step 1: Enter Mobile/Aadhaar */}
          {step === 1 && (
            <form onSubmit={handleSubmitId}>
              <label className="block mb-2 font-medium text-green-700">
                Aadhaar Number
              </label>
              <input
                type="text"
                required
                placeholder="Enter your aadhar number"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white font-semibold py-2 rounded hover:bg-green-600 transition shadow"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
              <p className="mt-5 text-center text-green-700 text-sm">
                Don't have an account? <a href="/register" className="underline">Register</a>
              </p>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setLoading(true);
                try {
                  const res = await fetch(`${baseURL}/otp/validate/`, {
                    method: "POST",
                    body: new URLSearchParams({ user_id: userId, otp }),
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  });
                  const data = await res.json();
                  if (data.message === "OTP validated") {
                    // After successful OTP validation
                    localStorage.setItem("userId", userId);
                    setUserId(userId);
                    window.location.href = "/digital-id";
                  } else {
                    setError(data.error || "Incorrect OTP");
                  }
                } catch {
                  setError("Network error");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <label className="block mb-2 font-medium text-green-700">
                Enter OTP
              </label>
              <input
                type="text"
                required
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white font-semibold py-2 rounded hover:bg-green-600 transition shadow"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="block mt-3 text-green-700 underline text-sm"
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </main>

    </div>
  );
}
