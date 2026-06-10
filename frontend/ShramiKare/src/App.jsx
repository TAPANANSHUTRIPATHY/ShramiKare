import React from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./Layout";

import LandingPage from "./pages/LandingPage";
import OtpLoginPage from "./pages/OtpLoginPage";
import DoctorDetailsPage from "./pages/DoctorDetailsPage";
import AadhaarCardPage from "./pages/AadhaarCardPage";
import DigitalHealthIdPage from "./pages/DigitalHealthIdPage";
import NotFound from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import OutbreakDashboardPage from "./pages/OutbreakDashboardPage";
import QrScannerPage from "./pages/QrScannerPage";

function App() {
  const [userId, setUserId] = React.useState(() => localStorage.getItem("userId") || null);

  // Listen for storage changes (e.g. demo login sets userId)
  React.useEffect(() => {
    const handleStorage = () => {
      setUserId(localStorage.getItem("userId") || null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<OtpLoginPage />} />
        <Route path="doctor-details" element={<DoctorDetailsPage />} />
        <Route path="aadhaar-capture" element={<AadhaarCardPage userId={userId} />} />
        <Route path="digital-id" element={<DigitalHealthIdPage userId={userId} />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="scan" element={<QrScannerPage />} />
        <Route path="admin/dashboard" element={<OutbreakDashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
