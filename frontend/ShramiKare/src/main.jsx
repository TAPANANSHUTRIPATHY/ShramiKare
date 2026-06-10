import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind CSS import
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
