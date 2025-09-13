import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./UserContext";
import CustomerPanel from "./pages/CustomerPanel.jsx";
import BusinessPanel from "./pages/BusinessPanel.jsx";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/panel-klienta" element={<CustomerPanel />} />
          <Route path="/panel-biznesu" element={<BusinessPanel />} />
          <Route path="*" element={<Navigate to="/panel-klienta" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
