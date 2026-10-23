import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { NewPasswordFields, PasswordInput, checkNewPassword, firstErrors } from "@/components/account/PasswordInputs";
import { StaffHero } from "@/components/staff/StaffHero";
import { StaffShell, useStaff } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/Button";
import { Card, Container } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError, changeOwnPassword } from "@/lib/api";

const ROLE_LABELS = { superadmin: "Superadmin", admin: "Admin", staff: "Staff" };
const ROLE_HELP = {
    superadmin: "You can do everything, including managing admins.",
    admin: "You can change records and manage staff accounts.",
    staff: "You can view records, download the CSV and run the draw.",
};

function ChangePasswordForm() {
    const { onUnauthenticated } = useStaff();
    const [current, setCurrent] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [failure, setFailure] = useState(null);
    const [busy, setBusy] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setMessage(null);
        setFailure(null);
        const local = { ...(current ? {} : { current_password: "Enter your current password." }), ...checkNewPassword(password, confirm) };
        setErrors(local);
        if (Object.keys(local).length) return;
        setBusy(true);
        try {
            const res = await changeOwnPassword(current, password, confirm);
            setMessage(res.message ?? "Your password has been changed.");
            setCurrent("");
            setPassword("");
            setConfirm("");
        }
        catch (err) {
            if (err instanceof ApiError && err.status === 401) return onUnauthenticated();
            if (err instanceof ApiError && err.isValidation) setErrors(firstErrors(err.errors));
            else setFailure(err instanceof Error ? err.message : "Could not change your password.");
        }
        finally {
            setBusy(false);
        }
    }

    return (<Card>
      <form onSubmit={submit} noValidate className="space-y-4 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
          <KeyRound className="size-5 text-brand-400" aria-hidden/> Change your password
        </h2>
        <PasswordInput id="account-current" label="Current password" autoComplete="current-password" value={current} onChange={setCurrent} error={errors.current_password}/>
        <NewPasswordFields idPrefix="account" password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} errors={errors}/>
        <p className="text-xs text-ink-400">Other browsers where you are signed in will be signed out. This one stays signed in.</p>
        {message && (<p role="status" className="rounded-lg border border-success-400/30 bg-success-400/10 px-3 py-2 text-sm text-success-400">
            {message}
          </p>)}
        {failure && <ErrorMessage title="Couldn't change your password" message={failure}/>}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Change password"}
        </Button>
      </form>
    </Card>);
}

function AccountDetails() {
    const { user } = useStaff();
    const role = user.role ?? "staff";
    return (<div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <Card>
        <div className="space-y-3 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
            <UserRound className="size-5 text-brand-400" aria-hidden/> Your account
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ink-400">Name</dt>
              <dd className="font-medium text-heading">{user.name}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Email (used to sign in)</dt>
              <dd className="break-all font-medium text-heading">{user.email}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Role</dt>
              <dd className="font-medium text-heading">{ROLE_LABELS[role] ?? role}</dd>
              <dd className="text-xs text-ink-400">{ROLE_HELP[role]}</dd>
            </div>
          </dl>
          <p className="text-xs text-ink-400">To change your name, email or role, ask an admin or the superadmin.</p>
        </div>
      </Card>
      <ChangePasswordForm />
    </div>);
}

/** Every role can open this: see your own details and change your own password. */
export default function AccountPage() {
    usePageTitle("My account");
    return (<>
      <StaffHero eyebrow="Staff area" title="My account">
        Change your own password here. Forgot it? Use “Forgot your password?” on the sign-in form to get a reset link by email.
      </StaffHero>
      <Container className="max-w-[88rem] py-8">
        <StaffShell>
          <AccountDetails />
        </StaffShell>
      </Container>
    </>);
}
