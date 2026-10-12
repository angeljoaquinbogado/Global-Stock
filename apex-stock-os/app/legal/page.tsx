import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LockKeyhole, Scale, ShieldCheck, Cookie } from "lucide-react";

import { PublicPage } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Centro legal — Global Stock",
  description:
    "Privacidad, términos de uso, seguridad e información legal de Global Stock."
};

const cards = [
  {
    href: "/legal/privacy",
    icon: LockKeyhole,
    title: "Privacidad",
    body: "Qué datos procesa Global Stock, para qué se usan y cómo funcionan las integraciones y la IA."
  },
  {
    href: "/legal/terms",
    icon: Scale,
    title: "Términos de uso",
    body: "Reglas de uso de la plataforma, cuentas, responsabilidades e integraciones."
  },
  {
    href: "/legal/cookies",
    icon: Cookie,
    title: "Cookies y almacenamiento",
    body: "Cuáles son los datos técnicos necesarios, las analíticas opcionales y cómo eliminarlos."
  },
  {
    href: "/legal/security",
    icon: ShieldCheck,
    title: "Seguridad",
    body: "Principios técnicos para credenciales, conexiones, sesiones y manejo responsable de datos."
  }
];

export default function LegalHubPage() {
  return (
    <PublicPage>
      <main className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
          Centro legal
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">
          Transparencia antes de conectar datos.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">
          Global Stock puede trabajar con inventario, ventas, ecommerce,
          comprobantes, notas y servicios de inteligencia artificial. Estas
          páginas explican cómo se organiza ese acceso y cuáles son las reglas
          de uso de la plataforma.
        </p>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {cards.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.055]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-500">
                <Icon size={18} />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">{body}</p>
            </Link>
          ))}
        </div>

        <section className="mt-10 rounded-[28px] border border-white/10 bg-black p-6">
          <div className="flex items-start gap-3">
            <FileText size={18} className="mt-1 shrink-0 text-red-500" />
            <div>
              <h2 className="text-sm font-semibold">Información del operador</h2>
              <p className="mt-2 text-sm leading-7 text-white/54">
                “Global Stock” identifica actualmente el producto de software
                creado y operado por <strong className="text-white">Angel Joaquin Bogado</strong>,
                con base en la Provincia de Buenos Aires, Argentina. Global Stock
                no constituye hoy una sociedad separada del operador. Soporte:{" "}
                <a className="text-white" href="mailto:support.globalstock@gmail.com">
                  support.globalstock@gmail.com
                </a>. Contacto legal y de privacidad:{" "}
                <a className="text-white" href="mailto:support.globalstock@gmail.com">
                  support.globalstock@gmail.com
                </a>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
