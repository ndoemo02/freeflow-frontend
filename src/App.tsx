import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./state/auth";
import { useUI } from "./state/ui";
// @ts-ignore
import { ToastProvider } from "./components/Toast";
// @ts-ignore
import { CartProvider } from "./state/CartContext";
// @ts-ignore
import Cart from "./components/Cart";
// @ts-ignore
import CartButton from "./components/CartButton";
// @ts-ignore
import CustomerPanel from "./pages/Panel/CustomerPanel";
// @ts-ignore
import BusinessPanel from "./pages/Panel/BusinessPanel";
// @ts-ignore
import BusinessPanelV2 from "./pages/Panel/BusinessPanelV2";
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
import LogoDemo from "./pages/LogoDemo";
// @ts-ignore
import HomeWithNewLogo from "./pages/HomeWithNewLogo";

// @ts-ignore
import AuthModal from "./components/AuthModal";
// @ts-ignore
import MenuDrawer from "./ui/MenuDrawer";
import OrgSwitcher from "./components/OrgSwitcher";
import TableReservations from "./components/TableReservations";
import { useAuth } from "./state/auth";
import { getUserRole } from "./lib/menuBuilder";


function AppContent() {
  const authOpen = useUI((s) => s.authOpen);
  const closeAuth = useUI((s) => s.closeAuth);
  const { user } = useAuth();

  // Sprawdź czy użytkownik jest vendor lub admin
  const userRole = getUserRole(user);
  const showOrgSwitcher = userRole === 'vendor' || userRole === 'admin';

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/panel/customer" element={<CustomerPanel />} />
          <Route path="/panel/business" element={<BusinessPanel />} />
          <Route path="/panel/business-v2" element={<BusinessPanelV2 />} />
          <Route path="/panel/taxi" element={<TaxiPanel />} />
          <Route path="/panel/restaurant" element={<BusinessPanel />} />
          <Route path="/panel/hotel" element={<BusinessPanel />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/business/register" element={<RegisterBusiness />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/reservations" element={<TableReservations />} />
          <Route path="/logo-demo" element={<LogoDemo />} />
          <Route path="/home-new-logo" element={<HomeWithNewLogo />} />

        </Routes>
      </main>

      {/* Global Components */}
      <MenuDrawer />
      {showOrgSwitcher && <OrgSwitcher />}
      {/* CartButton przeniesiony do TopBar */}
      <Cart />
      {authOpen && <AuthModal onClose={closeAuth} />}
    </div>
  );
}

import { ThemeProvider } from "./state/ThemeContext";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
