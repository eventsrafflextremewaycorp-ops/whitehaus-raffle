import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { DrawBoard } from "@/components/draw/DrawBoard";
import { TicketsList } from "@/components/draw/TicketsList";
import { WinnersAdmin } from "@/components/draw/WinnersAdmin";
import { ReceiptsApp } from "@/components/registered-customer/ReceiptsApp";
import { RegisteredCustomersApp } from "@/components/registered-customer/RegisteredCustomersApp";
import Branches from "@/pages/Branches";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Prizes from "@/pages/Prizes";
import Privacy from "@/pages/Privacy";
import PromoMechanics from "@/pages/PromoMechanics";
import Register from "@/pages/Register";
import Winners from "@/pages/Winners";
import DrawLayout from "@/pages/staff/DrawLayout";
import StaffAccountsPage from "@/pages/staff/StaffAccountsPage";
import LoginPage from "@/pages/staff/LoginPage";
import AccountPage from "@/pages/staff/AccountPage";
import ForgotPasswordPage from "@/pages/staff/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/staff/ResetPasswordPage";
import RegisteredCustomersLayout from "@/pages/staff/RegisteredCustomersLayout";

/** Scroll to the top when the route changes (the browser does this for real page loads, not for SPA navigation). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Header />
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/promo-mechanics" element={<PromoMechanics />} />
          <Route path="/participating-branches" element={<Branches />} />
          <Route path="/prizes" element={<Prizes />} />
          <Route path="/winners" element={<Winners />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Staff area: every screen sits behind the sign-in gate (StaffShell) and the API re-checks the session. */}
          <Route path="/registered-customers" element={<RegisteredCustomersLayout />}>
            <Route index element={<RegisteredCustomersApp />} />
            <Route path="receipts" element={<ReceiptsApp />} />
          </Route>
          <Route path="/draw" element={<DrawLayout />}>
            <Route index element={<DrawBoard />} />
            <Route path="tickets" element={<TicketsList />} />
            <Route path="winners" element={<WinnersAdmin />} />
          </Route>

          <Route path="/staff" element={<StaffAccountsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
