import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./state/auth";
import { useUI } from "./state/ui";
import { ToastProvider } from "./components/Toast";
import CustomerPanel from "./pages/Panel/CustomerPanel";
import BusinessPanel from "./pages/Panel/BusinessPanel";
import TaxiPanel from "./pages/Panel/TaxiPanel";
import CartPage from "./pages/CartPage";
import FAQ from "./pages/FAQ";
import RegisterBusiness from "./pages/RegisterBusiness";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import AuthModal from "./components/AuthModal";
import MenuDrawer from "./ui/MenuDrawer";

function AppContent() {
  const authOpen = useUI((s) => s.authOpen);
  const closeAuth = useUI((s) => s.closeAuth);

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
            <Route path="/panel/customer" element={<CustomerPanel />} />
            <Route path="/panel/business" element={<BusinessPanel />} />
            <Route path="/panel/taxi" element={<TaxiPanel />} />
            <Route path="/panel/restaurant" element={<BusinessPanel />} />
            <Route path="/panel/hotel" element={<BusinessPanel />} />
          <Route path="/cart" element={<CartPage />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/business/register" element={<RegisterBusiness />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
      
      {/* Global Components */}
      <MenuDrawer />
      {authOpen && <AuthModal onClose={closeAuth} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
