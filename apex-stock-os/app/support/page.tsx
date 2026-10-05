import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck, Wrench } from "lucide-react";

import { AccountDeletionCard } from "@/components/AccountDeletionCard";
import { PublicPage } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Soporte — Global Stock",
  description: "Soporte, privacidad y solicitudes de cuenta de Global Stock."
};

export default function SupportPage() {
  return (
    <PublicPage downloadBrand>
      <main className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
          Soporte
        </p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">
          Ayuda para usar, proteger o cerrar tu cuenta.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">
          Global Stock es operado por Angel Joaquin Bogado desde la Provincia de
          Buenos Aires, Argentina.
        </p>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
            <Mail size={19} className="text-red-500" />
            <h2 className="mt-4 text-lg font-semibold">Soporte general</h2>
            <p className="mt-2 text-sm leading-6 text-white/52">
              Problemas de acceso, instalación, funciones o integraciones.
            </p>
            <a
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-white/12 px-4 text-sm font-semibold"
              href="mailto:support.globalstock@gmail.com"
            >
              support.globalstock@gmail.com
            </a>
          </article>

          <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
            <ShieldCheck size={19} className="text-red-500" />
            <h2 className="mt-4 text-lg font-semibold">
              Privacidad y asuntos legales
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/52">
              Solicitudes sobre datos personales, privacidad o condiciones.
            </p>
            <a
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-white/12 px-4 text-sm font-semibold"
              href="mailto:support.globalstock@gmail.com"
            >
              support.globalstock@gmail.com
            </a>
          </article>

          <AccountDeletionCard />
        </div>

        <section className="mt-10 rounded-[28px] border border-white/10 bg-black p-6">
          <div className="flex items-start gap-3">
            <Wrench size={18} className="mt-1 shrink-0 text-red-500" />
            <div>
              <h2 className="text-sm font-semibold">Información útil</h2>
              <p className="mt-2 text-sm leading-7 text-white/54">
                Para acelerar un caso de soporte, incluí el dispositivo,
                navegador, pantalla donde ocurrió el problema y los pasos para
                reproducirlo. No envíes contraseñas, claves API ni tokens por
                correo.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/legal/privacy"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs"
                >
                  Privacidad
                </Link>
                <Link
                  href="/legal/security"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs"
                >
                  Seguridad
                </Link>
                <Link
                  href="/legal/terms"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs"
                >
                  Términos
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}