import { KeyRound, Pencil, RefreshCw, ShieldCheck, ShieldOff, UserPlus, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCan, useStaff } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput, describedBy } from "@/components/ui/FormField";
import { Card } from "@/components/ui/PageHeader";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/States";
import { ApiError, addStaff, getStaff, resetStaffPassword, setStaffActive, updateStaff } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const MIN_PASSWORD = 12;

const ROLE_LABELS = { superadmin: "Superadmin", admin: "Admin", staff: "Staff" };
const ROLE_HELP = {
  superadmin: "Everything, including managing admins.",
  admin: "Everything except managing admins; adds and manages staff.",
  staff: "View-only access plus running the draw.",
};
const ROLE_BADGE = { superadmin: "bg-brand-500/15 text-brand-300", admin: "bg-info-400/15 text-info-400", staff: "bg-ink-700 text-ink-200" };

function RoleSelect({ id, value, onChange, roles, error }) {
  return (
    <Field id={id} label="Role" error={error} hint={ROLE_HELP[value]}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy(id, error, true)}>
        {roles.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** A readable random password (no look-alike characters), made in the browser with crypto. */
function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

function fieldErrors(err) {
  return err instanceof ApiError && err.isValidation ? Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])) : {};
}

function PasswordField({ id, value, onChange, error }) {
  return (
    <Field id={id} label="Password" required error={error} hint={`At least ${MIN_PASSWORD} characters. Share it with the person privately.`}>
      <div className="flex gap-2">
        <TextInput id={id} type="text" autoComplete="off" spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, true)} />
        <Button variant="secondary" onClick={() => onChange(generatePassword())} title="Generate a strong password">
          <Sparkles className="size-4" aria-hidden /> Generate
        </Button>
      </div>
    </Field>
  );
}

function AddStaffForm({ onAdded, onUnauthenticated, roles }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      const created = await addStaff(form.name.trim(), form.email.trim(), form.password, form.role);
      setMessage({ ok: true, text: `${created.name} can now sign in with ${created.email} and the password you set.` });
      setForm({ name: "", email: "", password: "", role: "staff" });
      onAdded();
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthenticated) return onUnauthenticated();
      setErrors(fieldErrors(err));
      if (!(err instanceof ApiError && err.isValidation)) setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not add the staff member." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4 p-5" noValidate>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
          <UserPlus className="size-5 text-brand-400" aria-hidden /> {roles.length > 1 ? "Add an account" : "Add a staff member"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="staff-name" label="Full name" required error={errors.name}>
            <TextInput id="staff-name" value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("staff-name", errors.name)} />
          </Field>
          <Field id="staff-email" label="Email (used to sign in)" required error={errors.email}>
            <TextInput id="staff-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="off" aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("staff-email", errors.email)} />
          </Field>
        </div>
        {roles.length > 1 && <RoleSelect id="staff-role" value={form.role} onChange={set("role")} roles={roles} error={errors.role} />}
        <PasswordField id="staff-password" value={form.password} onChange={set("password")} error={errors.password} />
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-success-400" : "text-brand-300"}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          <UserPlus className="size-4" aria-hidden /> {busy ? "Adding…" : "Add staff member"}
        </Button>
      </form>
    </Card>
  );
}

function StaffRow({ person, busy, run, roles }) {
  const [mode, setMode] = useState(null); // null | "edit" | "password"
  const [name, setName] = useState(person.name);
  const [email, setEmail] = useState(person.email);
  const [role, setRole] = useState(person.role);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState(null);

  async function save(action, onDone) {
    setErrors({});
    setNote(null);
    const result = await run(action);
    if (result?.error) {
      setErrors(result.fields ?? {});
      if (!result.fields || Object.keys(result.fields).length === 0) setNote(result.error);
      return;
    }
    onDone?.();
    setMode(null);
  }

  return (
    <li className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-heading">
            {person.name}
            {person.is_you && <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-ink-200">You</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE[person.role] ?? ROLE_BADGE.staff}`}>{ROLE_LABELS[person.role] ?? person.role}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${person.active ? "bg-success-400/15 text-success-400" : "bg-ink-700 text-ink-300"}`}>{person.active ? "Active" : "Deactivated"}</span>
          </p>
          <p className="truncate text-sm text-ink-300">{person.email}</p>
          <p className="text-xs text-ink-400">Last sign-in: {person.last_login_at ? formatDateTime(person.last_login_at) : "never"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {person.can_manage && (
            <>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => setMode(mode === "edit" ? null : "edit")}>
                <Pencil className="size-4" aria-hidden /> Edit
              </Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => setMode(mode === "password" ? null : "password")}>
                <KeyRound className="size-4" aria-hidden /> {person.is_you ? "Change password" : "Reset password"}
              </Button>
            </>
          )}
          {!person.can_toggle_active ? null : person.active ? (
            <Button variant="danger" size="sm" disabled={busy} onClick={() => run(() => setStaffActive(person.id, false))}>
              <ShieldOff className="size-4" aria-hidden /> Deactivate
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(() => setStaffActive(person.id, true))}>
              <ShieldCheck className="size-4" aria-hidden /> Reactivate
            </Button>
          )}
        </div>
      </div>

      {mode === "edit" && (
        <form
          className="grid gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 md:grid-cols-[1fr_1fr_12rem_auto] md:items-end"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(() => updateStaff(person.id, name.trim(), email.trim(), person.can_change_role ? role : undefined));
          }}
        >
          <Field id={`name-${person.id}`} label="Full name" error={errors.name}>
            <TextInput id={`name-${person.id}`} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field id={`email-${person.id}`} label="Email" error={errors.email}>
            <TextInput id={`email-${person.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
          </Field>
          {person.can_change_role ? <RoleSelect id={`role-${person.id}`} value={role} onChange={setRole} roles={roles} error={errors.role} /> : <div />}
          <Button type="submit" disabled={busy}>
            Save
          </Button>
        </form>
      )}

      {mode === "password" && (
        <form
          className="space-y-3 rounded-lg border border-ink-700 bg-ink-900 p-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(() => resetStaffPassword(person.id, password), () => setPassword(""));
          }}
        >
          <PasswordField id={`pw-${person.id}`} value={password} onChange={setPassword} error={errors.password} />
          <p className="text-xs text-ink-400">{person.is_you ? "Your other browsers will be signed out." : "They will be signed out everywhere and must use the new password."}</p>
          <Button type="submit" disabled={busy}>
            Set new password
          </Button>
        </form>
      )}

      {note && (
        <p role="alert" className="text-sm text-brand-300">
          {note}
        </p>
      )}
    </li>
  );
}

/** Plain staff have view-and-draw access only, so they see a short explanation instead of the screen. */
export function StaffAccounts() {
  const can = useCan();
  if (!can.staff) {
    return <EmptyState title="Admins only" message="Your account can view records and run the draw. Ask an admin or the superadmin to add or change accounts." />;
  }
  return <StaffAccountsManager />;
}

function StaffAccountsManager() {
  const { onUnauthenticated } = useStaff();
  const [people, setPeople] = useState(null);
  const [roles, setRoles] = useState(["staff"]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  useEffect(() => {
    let stale = false;
    getStaff()
      .then((res) => {
        if (stale) return;
        setPeople(res.data);
        setRoles(res.meta?.assignable_roles?.length ? res.meta.assignable_roles : ["staff"]);
        setError(null);
      })
      .catch((e) => {
        if (stale) return;
        if (e instanceof ApiError && e.isUnauthenticated) onUnauthenticated();
        else setError(e instanceof Error ? e.message : "Could not load the staff list.");
      });
    return () => {
      stale = true;
    };
  }, [reloadCount, onUnauthenticated]);

  /** Runs one change; returns {error, fields} on failure so the row can show it, and reloads the list on success. */
  const run = useCallback(
    async (action) => {
      setBusy(true);
      try {
        await action();
        reload();
        return null;
      } catch (e) {
        if (e instanceof ApiError && e.isUnauthenticated) {
          onUnauthenticated();
          return { error: "Your session expired." };
        }
        return { error: e instanceof Error ? e.message : "Something went wrong.", fields: fieldErrors(e) };
      } finally {
        setBusy(false);
      }
    },
    [reload, onUnauthenticated],
  );

  if (!people) {
    return error ? (
      <ErrorMessage
        title="Couldn't load staff"
        message={error}
        action={
          <Button variant="secondary" size="sm" onClick={reload}>
            <RefreshCw className="size-4" aria-hidden /> Try again
          </Button>
        }
      />
    ) : (
      <LoadingState label="Loading staff…" />
    );
  }

  return (
    <div className="space-y-6">
      <AddStaffForm onAdded={reload} onUnauthenticated={onUnauthenticated} roles={roles} />
      <Card>
        <div className="border-b border-ink-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-heading">Everyone with an account ({people.length})</h2>
          <p className="mt-1 text-xs text-ink-400">Superadmin: everything. Admin: everything except managing admins. Staff: view and run the draw.</p>
        </div>
        {people.length === 0 ? (
          <EmptyState title="No staff yet" />
        ) : (
          <ul className="divide-y divide-ink-800">
            {people.map((person) => (
              <StaffRow key={`${person.id}-${person.name}-${person.email}-${person.active}-${person.role}`} person={person} busy={busy} run={run} roles={roles} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
