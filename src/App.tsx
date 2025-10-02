import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./state/auth";
import { useUI } from "./state/ui";
// @ts-ignore
import { ToastProvider } from "./components/Toast";
// @ts-ignore
import CustomerPanel from "./pages/Panel/CustomerPanel";
// @ts-ignore
import BusinessPanel from "./pages/Panel/BusinessPanel";
// @ts-ignore
import TaxiPanel from "./pages/Panel/TaxiPanel";
// @ts-ignore
import CartPage from "./pages/CartPage";
// @ts-ignore
import FAQ from "./pages/FAQ";
// @ts-ignore
import RegisterBusiness from "./pages/RegisterBusiness";
// @ts-ignore
import Settings from "./pages/Settings";
// @ts-ignore
import AdminPanel from "./pages/AdminPanel";
// @ts-ignore
import AuthModal from "./components/AuthModal";
// @ts-ignore
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
