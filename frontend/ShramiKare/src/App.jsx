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

function App() {
<<<<<<< Updated upstream
  const storedUserId = localStorage.getItem("userId");
  const [userId, setUserId] = React.useState(storedUserId || null);
=======
  const [userId, setUserId] = React.useState(() => localStorage.getItem("userId") || null);

<<<<<<< Updated upstream
  const handleLogin = (id) => {
    localStorage.setItem("userId", id);
    setUserId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setUserId(null);
  };
=======
  // Listen for storage changes (e.g. demo login sets userId)
  React.useEffect(() => {
    const handleStorage = () => {
      setUserId(localStorage.getItem("userId") || null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
>>>>>>> Stashed changes
>>>>>>> Stashed changes

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<OtpLoginPage />} />
        <Route path="doctor-details" element={<DoctorDetailsPage />} />
        <Route path="aadhaar-capture" element={<AadhaarCardPage userId={userId} />} />
        <Route path="digital-id" element={<DigitalHealthIdPage userId={userId} />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
