import React, { useState } from "react";
import { API_BASE_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";

export default function OtpLoginPage() {
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const handleSubmitId = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/generate/`, {
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
      setError("Network error — is the backend running?");
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
                onError={e => { e.target.onerror = null; e.target.src = "/sample_aadhar.png"; }}
              />
            </div>
            <h1 className="text-2xl text-green-800 font-bold">{t("title")}</h1>
            <p className="text-green-700">{t("tagline")}</p>
          </div>
          <h2 className="font-semibold text-green-700 text-center mb-6 text-xl">
            {t("welcomeBack")}
          </h2>

          {step === 1 && (
            <form onSubmit={handleSubmitId}>
              <label className="block mb-2 font-medium text-green-700">{t("aadhaarNumber")}</label>
              <input
                type="text"
                required
                placeholder={t("enterAadhaar")}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white font-semibold py-2 rounded hover:bg-green-600 transition shadow"
              >
                {loading ? t("sendingOtp") : t("sendOtp")}
              </button>
              {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
              <p className="mt-5 text-center text-green-700 text-sm">
                {t("dontHaveAccount")} <a href="/register" className="underline">{t("register")}</a>
              </p>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setLoading(true);
                try {
                  const res = await fetch(`${API_BASE_URL}/otp/validate/`, {
                    method: "POST",
                    body: new URLSearchParams({ user_id: userId, otp }),
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  });
                  const data = await res.json();
                  if (data.message === "OTP validated") {
                    localStorage.setItem("userId", userId);
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
              <label className="block mb-2 font-medium text-green-700">{t("enterOtp")}</label>
              <input
                type="text"
                required
                placeholder={t("enterOtp")}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white font-semibold py-2 rounded hover:bg-green-600 transition shadow"
              >
                {loading ? t("verifyingOtp") : t("verifyOtp")}
              </button>
              {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
              <button type="button" onClick={() => setStep(1)} className="block mt-3 text-green-700 underline text-sm">
                Change number
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
