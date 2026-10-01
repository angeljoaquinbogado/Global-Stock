import type { Metadata } from "next";
import {
  BrainCircuit,
  Globe2,
  ShieldCheck,
  Workflow
} from "lucide-react";

import { PublicPage } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Quiénes somos — Global Stock",
  description:
    "Conocé el propósito y los principios detrás de Global Stock."
};

export default function AboutPage() {
  return (
    <PublicPage>
      <main>
        <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
            Quiénes somos
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
            Software de gestión pensado para entenderse.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/60">
            Global Stock nació con una idea concreta: que un negocio pueda
            controlar ventas, stock, ecommerce, reposición, proveedores y
            decisiones operativas sin tener que repartir su información entre
            herramientas desconectadas.
          </p>
        </section>

        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto grid w-full max-w-7xl gap-3 px-5 py-16 sm:px-8 md:grid-cols-2">
            {[
              {
                icon: Workflow,
                title: "Una sola operación",
                body: "El mismo catálogo puede alimentar punto de venta, almacén y canales online, evitando duplicar trabajo."
              },
              {
                icon: ShieldCheck,
                title: "Autorización antes que acceso",
                body: "Detectar una tienda pública no equivale a tener permiso. Las funciones privadas exigen verificación y permisos explícitos."
              },
              {
                icon: BrainCircuit,
                title: "IA con contexto real",
                body: "Global Intelligence está diseñada para razonar sobre los datos reales que la empresa autoriza: inventario, ventas, notas y actividad."
              },
              {
                icon: Globe2,
                title: "Pensada para crecer",
                body: "Idioma, moneda, dispositivos y canales pueden adaptarse para una operación local o internacional."
              }
            ].map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-[26px] border border-white/10 bg-black p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-500">
                  <Icon size={19} />
                </span>
                <h2 className="mt-4 text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-white/54">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.045em]">
            Cómo trabajamos
          </h2>
          <div className="mt-8 space-y-6 text-sm leading-7 text-white/60">
            <p>
              <strong className="text-white">Datos antes que suposiciones.</strong>{" "}
              Si un costo, stock o dato comercial no está disponible, la app
              debe indicarlo en lugar de inventarlo para completar una métrica.
            </p>
            <p>
              <strong className="text-white">Privacidad por diseño.</strong>{" "}
              Los accesos sensibles se mantienen del lado del servidor siempre
              que corresponde y las integraciones pueden revocarse.
            </p>
            <p>
              <strong className="text-white">Interfaz antes que complejidad.</strong>{" "}
              El objetivo no es mostrar más controles, sino que cada control
              tenga una función comprensible y sea usable en computadora,
              tablet o teléfono.
            </p>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
