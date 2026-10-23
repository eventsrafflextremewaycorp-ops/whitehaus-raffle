import { Outlet } from "react-router-dom";
import { StaffHero } from "@/components/staff/StaffHero";
import { StaffShell } from "@/components/staff/StaffShell";
import { Container } from "@/components/ui/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Staff area (login required). The shared Header hides the global Register
 * button on these routes (see lib/site.js → showsRegisterButton).
 */
export default function RegisteredCustomersLayout() {
  usePageTitle("Registered Customers");
  return (
    <>
      <StaffHero eyebrow="Raffle registration validation" title="Registered customers">
        Review online registrations, check proof of purchase, and validate entries - by hand or automatically from the company receipt list.
      </StaffHero>
      <Container className="max-w-[88rem] py-8">
        <StaffShell>
          <Outlet />
        </StaffShell>
      </Container>
    </>
  );
}
