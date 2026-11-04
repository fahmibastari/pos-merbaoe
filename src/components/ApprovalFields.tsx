"use client";

import { Field } from "./Field";
export type ApprovalAdmin = { id: number; name: string };

export function ApprovalFields({ admins, prefix, disabled, adminId, pin, onAdminChange, onPinChange }: {
  admins: ApprovalAdmin[]; prefix: string; disabled?: boolean;
  adminId?: string; pin?: string; onAdminChange?: (value: string) => void; onPinChange?: (value: string) => void;
}) {
  return <div className="stack-sm">
    <Field label="Persetujuan Admin" name="approvalAdminId" id={`${prefix}-admin`} control={
      <select className="input" required disabled={disabled} value={adminId} defaultValue={adminId === undefined ? String(admins[0]?.id ?? "") : undefined} onChange={onAdminChange ? (event) => onAdminChange(event.target.value) : undefined}>
        {admins.length === 0 && <option value="">Belum ada Admin aktif</option>}
        {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name}</option>)}
      </select>
    } />
    <Field label="PIN Admin" name="approvalPin" id={`${prefix}-pin`} hint="Admin menyetujui dengan PIN 6 digit, berbeda dari password login." control={
      <input className="input" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="off" disabled={disabled} value={pin} onChange={onPinChange ? (event) => onPinChange(event.target.value) : undefined} />
    } />
  </div>;
}
