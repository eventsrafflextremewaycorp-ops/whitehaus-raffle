import { RegisteredCustomersDashboard } from "./RegisteredCustomersDashboard";
import { useStaff } from "@/components/staff/StaffShell";
/** The login gate lives in <StaffShell> (app/registered-customers/layout.tsx). */
export function RegisteredCustomersApp() {
    const { onUnauthenticated } = useStaff();
    return <RegisteredCustomersDashboard onUnauthenticated={onUnauthenticated}/>;
}
