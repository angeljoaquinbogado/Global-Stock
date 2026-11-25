import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PublicPage } from "@/components/PublicSiteChrome";
import { SupportInteractive } from "@/components/support/SupportInteractive";

export const metadata: Metadata = {
  title: "Soporte y ayuda | Global Stock",
  description:
    "Asistencia para configurar tu negocio, instalar Global Stock en celular o computadora y resolver dudas sobre stock, ventas y caja."
};

export default function SupportPage() {
  return (
    <PublicPage>
      <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <Link
          href="/download"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Volver a la página principal
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#ef5350]">
          Soporte técnico
        </p>
        <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
          Ayuda para empezar y resolver dudas
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
          Escribinos si necesitás asistencia con tu cuenta, la instalación en tus dispositivos o la configuración
          inicial de tu inventario y caja.
        </p>

        <SupportInteractive />

        <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-6 text-sm text-white/55">
          <Link href="/legal/terms" className="hover:text-white">
            Términos de uso
          </Link>
          <Link href="/legal/privacy" className="hover:text-white">
            Política de privacidad
          </Link>
          <Link href="/legal/security" className="hover:text-white">
            Seguridad
          </Link>
        </div>
      </main>
    </PublicPage>
  );
}