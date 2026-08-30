"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { ManagedUserDTO } from "@/lib/user-management";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import {
  createCashierAction,
  resetUserPasswordAction,
  setUserActiveAction,
} from "./actions";
import styles from "./users.module.css";

type SelectedUser = Pick<
  ManagedUserDTO,
  "id" | "name" | "username" | "isActive" | "hasOpenShift"
>;
type ModalState =
  | { kind: "create" }
  | { kind: "reset"; user: SelectedUser }
  | { kind: "status"; user: SelectedUser }
  | null;

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function displayDate(value: string | null): string {
  return value ? dateTime.format(new Date(value)) : "Belum pernah";
}

export default function UserManager({
  users,
  currentUserId,
}: {
  users: ManagedUserDTO[];
  currentUserId: number;
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [pending, setPending] = useState(false);

  function openModal(next: Exclude<ModalState, null>) {
    setResult(null);
    setModal(next);
  }

  function closeModal() {
    if (!pending) setModal(null);
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<ActionResult<unknown>>,
  ) {
    event.preventDefault();
    setPending(true);
    try {
      const nextResult = await action(new FormData(event.currentTarget));
      setResult(nextResult);
      if (nextResult.ok) setModal(null);
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <section className={styles.toolbar}>
        <div>
          <h2>Akun operasional</h2>
          <p>
            Akun dipertahankan sebagai riwayat; pegawai yang tidak lagi bertugas
            dinonaktifkan, bukan dihapus.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openModal({ kind: "create" })}
        >
          + Tambah Kasir
        </button>
      </section>

      {!modal && <Feedback result={result} />}

      <DataTable className={styles.tableSurface}>
        <table>
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Login Terakhir</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="Belum ada pengguna"
                    description="Tambahkan akun kasir agar operasional POS dapat dimulai."
                    action={
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openModal({ kind: "create" })}
                      >
                        + Tambah Kasir
                      </button>
                    }
                  />
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong className={styles.userName}>{user.name}</strong>
                    <span className={styles.username}>@{user.username}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.role === "admin" ? "badge-brand" : "badge-info"}`}>
                      {user.role === "admin" ? "Administrator" : "Kasir"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      {user.hasOpenShift && (
                        <span className="badge badge-warning">Shift terbuka</span>
                      )}
                    </div>
                  </td>
                  <td className="meta">{displayDate(user.lastLoginAt)}</td>
                  <td className="meta">{displayDate(user.createdAt)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.rowAction}
                        disabled={pending}
                        onClick={() => openModal({ kind: "reset", user })}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        className={`${styles.rowAction} ${user.isActive ? styles.rowActionDanger : ""}`.trim()}
                        disabled={pending || (user.id === currentUserId && user.isActive)}
                        title={
                          user.id === currentUserId && user.isActive
                            ? "Akun yang sedang dipakai tidak dapat dinonaktifkan"
                            : undefined
                        }
                        onClick={() => openModal({ kind: "status", user })}
                      >
                        {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTable>

      <Modal open={modal?.kind === "create"} title="Tambah Akun Kasir" onClose={closeModal}>
        <form className="stack-sm" onSubmit={(event) => void submit(event, createCashierAction)}>
          <Field
            label="Nama Pengguna"
            name="name"
            result={result}
            control={<input className="input" required maxLength={100} autoComplete="name" placeholder="Nama kasir" />}
          />
          <Field
            label="Username"
            name="username"
            result={result}
            hint="3–50 karakter; gunakan huruf kecil, angka, titik, garis bawah, atau tanda hubung."
            control={<input className="input" required minLength={3} maxLength={50} autoComplete="username" placeholder="kasir.pagi" />}
          />
          <Field
            label="Password Awal"
            name="password"
            result={result}
            hint="Minimal 8 karakter. Minta kasir menggantinya melalui administrator."
            control={<input className="input" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />}
          />
          <Field
            label="Konfirmasi Password"
            name="passwordConfirmation"
            result={result}
            control={<input className="input" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />}
          />
          <Feedback result={result} />
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" disabled={pending} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
              <PendingButtonContent pending={pending} pendingLabel="Membuat akun...">Buat Akun</PendingButtonContent>
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.kind === "reset"} title="Reset Password" onClose={closeModal}>
        {modal?.kind === "reset" && (
          <form className="stack-sm" onSubmit={(event) => void submit(event, resetUserPasswordAction)}>
            <input type="hidden" name="id" value={modal.user.id} />
            <p className={styles.modalIntro}>
              Tetapkan password baru untuk <strong>{modal.user.name}</strong> (@{modal.user.username}). Seluruh sesi lamanya akan langsung dicabut.
            </p>
            <Field
              label="Password Baru"
              name="password"
              result={result}
              hint="Minimal 8 karakter."
              control={<input className="input" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />}
            />
            <Field
              label="Konfirmasi Password"
              name="passwordConfirmation"
              result={result}
              control={<input className="input" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />}
            />
            <Feedback result={result} />
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={closeModal}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
                <PendingButtonContent pending={pending} pendingLabel="Mereset password...">Reset Password</PendingButtonContent>
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={modal?.kind === "status"}
        title={
          modal?.kind === "status" && modal.user.isActive
            ? modal.user.hasOpenShift
              ? "Tutup Shift Terlebih Dahulu"
              : "Nonaktifkan Akun"
            : "Aktifkan Akun"
        }
        onClose={closeModal}
      >
        {modal?.kind === "status" && modal.user.isActive && modal.user.hasOpenShift ? (
          <div className="stack-sm">
            <Feedback
              tone="info"
              title="Shift masih terbuka"
              message={`Tutup shift milik @${modal.user.username} sebelum menonaktifkan akun agar rekonsiliasi kas tetap dapat diselesaikan.`}
            />
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-primary" onClick={closeModal}>
                Mengerti
              </button>
            </div>
          </div>
        ) : modal?.kind === "status" ? (
          <form className="stack-sm" onSubmit={(event) => void submit(event, setUserActiveAction)}>
            <input type="hidden" name="id" value={modal.user.id} />
            <input type="hidden" name="isActive" value={String(!modal.user.isActive)} />
            <p className={styles.modalIntro}>
              {modal.user.isActive
                ? `Akun @${modal.user.username} tidak akan dapat masuk dan seluruh sesi aktifnya dicabut.`
                : `Akun @${modal.user.username} akan diizinkan masuk kembali.`}
            </p>
            <Feedback result={result} />
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={closeModal}>Batal</button>
              <button
                type="submit"
                className={modal.user.isActive ? "btn btn-danger" : "btn btn-primary"}
                disabled={pending}
                aria-busy={pending}
              >
                <PendingButtonContent
                  pending={pending}
                  pendingLabel={modal.user.isActive ? "Menonaktifkan akun..." : "Mengaktifkan akun..."}
                >
                  {modal.user.isActive ? "Nonaktifkan" : "Aktifkan"}
                </PendingButtonContent>
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
