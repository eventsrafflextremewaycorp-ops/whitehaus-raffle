import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Field, TextInput, describedBy } from "@/components/ui/FormField";

export const MIN_PASSWORD = 12;

/** Turns a Laravel 422 into {field: firstMessage}. */
export function firstErrors(errors) {
    return Object.fromEntries(Object.entries(errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
}

/** Password box with a show/hide toggle. */
export function PasswordInput({ id, label, value, onChange, error, hint, autoComplete = "new-password" }) {
    const [show, setShow] = useState(false);
    return (<Field id={id} label={label} required error={error} hint={hint}>
      <div className="relative">
        <TextInput id={id} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className="pr-11"/>
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-400 hover:text-heading" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
          {show ? <EyeOff className="size-4" aria-hidden/> : <Eye className="size-4" aria-hidden/>}
        </button>
      </div>
    </Field>);
}

/** New password + confirmation, checked in the browser before sending (the server checks again). */
export function NewPasswordFields({ idPrefix, password, confirm, onPassword, onConfirm, errors }) {
    return (<>
      <PasswordInput id={`${idPrefix}-new`} label="New password" value={password} onChange={onPassword} error={errors.password} hint={`At least ${MIN_PASSWORD} characters. A short phrase is easy to remember.`}/>
      <PasswordInput id={`${idPrefix}-confirm`} label="Type it again" value={confirm} onChange={onConfirm} error={errors.password_confirmation}/>
    </>);
}

/** Browser-side checks so people see mistakes before submitting. Returns {} when fine. */
export function checkNewPassword(password, confirm) {
    if (password.length < MIN_PASSWORD) return { password: `Use at least ${MIN_PASSWORD} characters.` };
    if (password !== confirm) return { password_confirmation: "The two passwords don't match." };
    return {};
}
