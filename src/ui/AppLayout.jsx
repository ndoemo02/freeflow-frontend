import React from "react";
import Header from "./Header.jsx";
import MenuDrawer from "./MenuDrawer.jsx";
import AuthModal from "../components/AuthModal.jsx";
import { useUI } from "../state/ui";
import { useAuth } from "../state/auth";

export default function AppLayout({ children }) {
  const authOpen = useUI(s => s.authOpen);
  const closeAuth = useUI(s => s.closeAuth);
  const { user } = useAuth();
  return (
    <div className="ff-app">
      <Header />
      {/* MenuDrawer jest globalnie – nie wkładaj go do stron, żeby uniknąć duplikatów */}
      <MenuDrawer />
      <AuthModal open={authOpen && !user} onClose={closeAuth} />
      <main className="ff-main">{children}</main>
    </div>
  );
}

