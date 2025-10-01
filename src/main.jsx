// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Jeśli nie masz aliasu "@", zamień na relative:
// import AppLayout from "./ui/AppLayout";
// import HomeClassic from "./pages/HomeClassic";
// import FAQ from "./pages/FAQ";

import AppLayout from "./ui/AppLayout.jsx";
import HomeClassic from "./pages/HomeClassic.jsx";
import FAQ from "./pages/FAQ.jsx";
import CustomerPanel from "./pages/Panel/CustomerPanel.jsx";
import BusinessPanel from "./pages/Panel/BusinessPanel.jsx";
import TaxiPanel from "./pages/Panel/TaxiPanel.jsx";
import PrivateRoute from "./pages/PrivateRoute.jsx";
import { AuthProvider } from "./state/auth";
import { ToastProvider } from "./components/Toast";
import "./index.css";

// Jeśli masz Auth (nie jest wymagane do startu):
// import AuthCallback from "@/pages/AuthCallback";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomeClassic />} />
              <Route path="/faq" element={<FAQ />} />
              
              {/* Protected Panel Routes */}
              <Route path="/panel" element={<PrivateRoute><Navigate to="/panel/customer" replace /></PrivateRoute>} />
              <Route path="/panel/customer" element={<PrivateRoute><CustomerPanel /></PrivateRoute>} />
              <Route path="/panel/business" element={<PrivateRoute><BusinessPanel /></PrivateRoute>} />
              <Route path="/panel/taxi" element={<PrivateRoute><TaxiPanel /></PrivateRoute>} />
              
              {/* Zostawiamy redirect na wszelki wypadek */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);