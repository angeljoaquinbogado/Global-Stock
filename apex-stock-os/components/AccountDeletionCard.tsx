"use client";

import Link from "next/link";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";

const CONFIRMATION_PHRASE = "ELIMINAR MI CUENTA";

function humanizeDeletionError(message: string) {
  if (message.includes("OWNERSHIP_TRANSFER_REQUIRED")) {
    return "No podemos eliminar la cuenta todavía porque sos propietario de un espacio que tiene otros miembros. Primero transferí la propiedad de ese espacio y después volvé a intentarlo.";
  }

  if (message.includes("EMAIL_MISMATCH")) {
    return "El correo de confirmación no coincide con la cuenta que está iniciada.";
  }

  if (message.includes("CONFIRMATION_REQUIRED")) {
    return "Escribí exactamente “ELIMINAR MI CUENTA” para confirmar.";
  }

  if (message.includes("AUTH_REQUIRED")) {
    return "Tu sesión ya no es válida. Iniciá sesión nuevamente antes de eliminar la cuenta.";
  }

  return "No se pudo eliminar la cuenta. No se borró ningún dato. Volvé a intentarlo o contactá a soporte.";
}

export function AccountDeletionCard() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [phraseConfirmation, setPhraseConfirmation] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const canDelete = useMemo(
    () =>
      Boolean(signedInEmail) &&
      emailConfirmation.trim().toLowerCase() ===
        signedInEmail.trim().toLowerCase() &&
      phraseConfirmation.trim() === CONFIRMATION_PHRASE &&
      !deleting,
    [signedInEmail, emailConfirmation, phraseConfirmation, deleting]
  );

  async function openDeletionFlow() {
    setChecking(true);
    setError("");
    setNeedsLogin(false);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setError("La autenticación de Global Stock no está disponible en este momento.");
        setOpen(true);
        return;
      }

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        setNeedsLogin(true);
        setOpen(true);
        return;
      }

      setSignedInEmail(user.email);
      setEmailConfirmation("");
      setPhraseConfirmation("");
      setOpen(true);
    } catch {
      setNeedsLogin(true);
      setOpen(true);
    } finally {
      setChecking(false);
    }
  }

  async function deleteAccount() {
    if (!canDelete) return;

    setDeleting(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("AUTH_REQUIRED");
      }

      const { error: deleteError } = await supabase.rpc(
        "global_stock_delete_my_account",
        {
          p_confirm_email: emailConfirmation.trim(),
          p_confirm_phrase: phraseConfirmation.trim()
        }
      );

      if (deleteError) {
        throw deleteError;
      }

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The Auth row has already been deleted. Navigation below clears the
        // authenticated app state even if a provider cannot acknowledge logout.
      }

      window.location.replace("/");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : String(caught ?? "");
      setError(humanizeDeletionError(message));
      setDeleting(false);
    }
  }

  return (
    <>
      <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
        <Trash2 size={19} className="text-red-500" />
        <h2 className="mt-4 text-lg font-semibold">
          Eliminación de cuenta y datos
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Eliminá tu cuenta de Global Stock y los datos asociados directamente
          desde la aplicación.
        </p>
        <button
          type="button"
          onClick={openDeletionFlow}
          disabled={checking}
          className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-white/12 px-4 text-sm font-semibold transition hover:bg-white/[0.05] disabled:cursor-wait disabled:opacity-60"
        >
          {checking ? "Verificando sesión…" : "Eliminar mi cuenta"}
        </button>
      </article>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-lg rounded-[28px] border border-white/12 bg-[#0B0B0D] p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <Trash2 size={19} />
                </div>
                <h2
                  id="delete-account-title"
                  className="mt-4 text-2xl font-semibold tracking-[-0.03em]"
                >
                  Eliminar cuenta
                </h2>
              </div>

              <button
                type="button"
                onClick={() => !deleting && setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {needsLogin ? (
              <div className="mt-6">
                <p className="text-sm leading-6 text-white/62">
                  Tenés que iniciar sesión con la cuenta que querés eliminar.
                  La eliminación siempre se ejecuta sobre la cuenta autenticada,
                  nunca sobre un correo escrito manualmente.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white"
                >
                  Ir a iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-400"
                    />
                    <p className="text-sm leading-6 text-white/66">
                      Esta acción es permanente. Elimina tu acceso, perfil,
                      sesiones, membresías y preferencias. Si sos el único
                      propietario de un espacio, ese espacio y sus datos también
                      se eliminan. Si el espacio tiene otros miembros, Global
                      Stock bloqueará la eliminación hasta que transfieras la
                      propiedad.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/36">
                      Cuenta autenticada
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {signedInEmail}
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold text-white/55">
                      Escribí tu correo para confirmar
                    </span>
                    <input
                      type="email"
                      value={emailConfirmation}
                      onChange={(event) =>
                        setEmailConfirmation(event.target.value)
                      }
                      autoComplete="off"
                      className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-red-500/60"
                      placeholder={signedInEmail || "tu@correo.com"}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-white/55">
                      Escribí {CONFIRMATION_PHRASE}
                    </span>
                    <input
                      type="text"
                      value={phraseConfirmation}
                      onChange={(event) =>
                        setPhraseConfirmation(event.target.value)
                      }
                      autoComplete="off"
                      className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-red-500/60"
                      placeholder={CONFIRMATION_PHRASE}
                    />
                  </label>
                </div>

                {error ? (
                  <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm leading-6 text-red-100">
                    {error}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={deleting}
                    className="min-h-11 rounded-2xl border border-white/12 px-5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.05] disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={deleteAccount}
                    disabled={!canDelete}
                    className="min-h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {deleting ? "Eliminando…" : "Eliminar definitivamente"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
