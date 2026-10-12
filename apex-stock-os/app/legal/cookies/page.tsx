import type { Metadata } from "next";
import { LegalArticle } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Cookies y almacenamiento — Global Stock",
  description: "Qué guarda Global Stock en el navegador, con qué fin y qué opciones tenés."
};

export default function CookiesPage() {
  return (
    <LegalArticle
      eyebrow="Privacidad"
      title="Cookies y almacenamiento"
      intro="Revisado el 12 de octubre de 2026. Explicamos qué datos puede guardar el navegador, cuándo son necesarios y cómo se distinguen de las herramientas opcionales de medición."
    >
      <section>
        <h2>Lo necesario para que Global Stock funcione</h2>
        <p>
          La plataforma puede usar cookies de sesión, almacenamiento local, datos de
          preferencia y almacenamiento temporal del navegador para autenticación,
          selección de idioma y tema, recuperación de operaciones y funcionamiento
          sin conexión. La aplicación instalable puede almacenar recursos técnicos
          mediante un service worker. Estos mecanismos no deben utilizarse para
          publicidad personalizada.
        </p>
      </section>
      <section>
        <h2>Analíticas y seguimiento</h2>
        <p>
          El sitio no integra actualmente una etiqueta de analíticas publicitarias
          opcionales en su diseño principal. La infraestructura puede procesar
          registros técnicos de solicitudes y diagnósticos necesarios para seguridad
          y funcionamiento. Si incorporamos herramientas opcionales de medición o
          marketing en el navegador, deberán permanecer desactivadas hasta contar
          con una elección informada cuando corresponda. No interpretamos el uso
          del sitio como permiso para publicidad.
        </p>
      </section>
      <section>
        <h2>Google, mapas y servicios externos</h2>
        <p>
          El inicio de sesión con Google y la apertura de mapas pueden conectar el
          navegador con servicios externos cuando se utilizan. Esos proveedores
          pueden aplicar sus propias políticas. La tipografía principal utiliza
          fuentes del sistema; no se requiere descargar Google Fonts para leer
          las páginas principales de Global Stock.
        </p>
      </section>
      <section>
        <h2>Cómo controlar o eliminar datos</h2>
        <p>
          Podés revisar o borrar cookies, datos del sitio, permisos y almacenamiento
          desde la configuración del navegador. Al hacerlo es posible que debas
          iniciar sesión nuevamente o que desaparezcan preferencias y borradores
          locales no sincronizados. Eliminar datos del navegador no elimina
          automáticamente la cuenta ni el inventario guardado en Supabase.
        </p>
      </section>
      <section>
        <h2>Comunicación y consultas</h2>
        <p>
          Para consultas sobre datos, proveedores y privacidad escribí a{" "}
          <a href="mailto:support.globalstock@gmail.com">support.globalstock@gmail.com</a>.
          La política general de tratamiento está en{" "}
          <a href="/legal/privacy">Privacidad</a>.
        </p>
      </section>
    </LegalArticle>
  );
}
