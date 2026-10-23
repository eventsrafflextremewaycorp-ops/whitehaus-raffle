import { useEffect } from "react";
import { StaffHero } from "@/components/staff/StaffHero";
import { AdminLogin } from "@/components/registered-customer/AdminLogin";
import { Container } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/States";
import { useAuth } from "@/context/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocation, useNavigate } from "@/lib/router";
import { REGISTERED_CUSTOMERS_ROUTE } from "@/lib/site";

/** Only same-site paths are accepted as a destination, so a crafted ?next= can't send people elsewhere. */
function safeNext(search) {
  const next = new URLSearchParams(search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : REGISTERED_CUSTOMERS_ROUTE;
}

/** /login - the Login button in the header lands here. Already signed in? Go straight on. */
export default function LoginPage() {
  usePageTitle("Staff sign-in");
  const auth = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    if (auth.user) navigate(safeNext(search), { replace: true });
  }, [auth.user, navigate, search]);

  return (
    <>
      <StaffHero eyebrow="Staff area" title="Staff sign-in">
        For authorized Xtremeway staff. Once signed in you can open registered customers and the raffle draw.
      </StaffHero>
      <Container className="py-10">
        {auth.status === "checking" || auth.user ? <LoadingState label="One moment…" /> : <AdminLogin notice={auth.notice} onSignedIn={auth.signIn} />}
      </Container>
    </>
  );
}
