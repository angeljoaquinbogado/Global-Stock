import type { Metadata } from "next";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { SupportInteractive } from "@/components/support/SupportInteractive";

export const metadata: Metadata = {
  title: "Soporte técnico | Global Stock",
  description:
    "Contactá al equipo de soporte de Global Stock para ayuda con tu cuenta, instalación en celular o PC, caja y escáner móvil."
};

export default function SupportPage() {
  return (
    <PublicSiteChrome>
      <main className="gs-sup-wrap">
        <header className="gs-sup-hero">
          <span className="gs-sup-kicker">Centro de ayuda · Global Stock</span>
          <h1 className="gs-sup-title">¿En qué te podemos ayudar?</h1>
          <p className="gs-sup-lead">
            Escribinos por correo directo o prepará tu consulta en segundos para recibir asistencia personalizada.
          </p>
        </header>

        <SupportInteractive />
      </main>
    </PublicSiteChrome>
  );
}