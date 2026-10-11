import type { Metadata } from "next";

import { LegalArticle } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Términos de uso — Global Stock",
  description: "Términos de uso de Global Stock."
};

export default function TermsPage() {
  return (
    <LegalArticle
      eyebrow="Términos"
      title="Términos de uso"
      intro="Versión 2026-10-11. Estos términos regulan el acceso y uso de Global Stock. La app móvil registra la aceptación expresa antes del primer uso. La publicación de esta página no habilita automáticamente operaciones comerciales o fiscales en todas las jurisdicciones."
    >
      <section>
        <h2>1. Operador</h2>
        <p>
          Global Stock es un proyecto de software creado y operado actualmente
          por <strong>Angel Joaquin Bogado</strong>, con base en la Provincia de
          Buenos Aires, Argentina. Global Stock no constituye hoy una sociedad
          separada del operador. Soporte:{" "}
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>. Asuntos legales o de privacidad:{" "}
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>.
        </p>
      </section>

      <section>
        <h2>2. Finalidad del servicio</h2>
        <p>
          Global Stock ofrece herramientas para organizar inventario, ventas,
          punto de venta, proveedores, reposición, códigos de barras, ecommerce,
          comprobantes internos, notas, cotizaciones e inteligencia operativa.
          Algunas funciones dependen de servicios externos o de una integración
          autorizada por el usuario.
        </p>
      </section>

      <section>
        <h2>3. Capacidad y cuentas</h2>
        <p>
          Para el registro y uso de la aplicación móvil en esta etapa,
          Global Stock exige que la persona tenga al menos 18 años y capacidad
          legal suficiente para contratar o administrar un negocio. El acceso
          mediante una cuenta de una persona adulta no habilita su transferencia
          a menores de edad. La confirmación de edad en la app es una
          declaración de la persona usuaria y no una verificación documental
          de identidad o edad. La persona usuaria debe proteger sus credenciales
          y no compartir contraseñas ni tokens fuera de los canales previstos.
        </p>
      </section>

      <section>
        <h2>4. Datos y operaciones del negocio</h2>
        <p>
          El usuario conserva la responsabilidad sobre la legitimidad y exactitud
          de los datos que carga o sincroniza, incluidos datos de terceros,
          costos, precios, stock, proveedores y movimientos. Global Stock no debe
          completar como hechos reales los datos que no hayan sido suministrados
          o verificados.
        </p>
      </section>

      <section>
        <h2>5. Integraciones y propiedad de tiendas</h2>
        <p>
          Detectar una URL pública no concede permiso para leer información
          privada ni modificar stock. Las funciones de sincronización requieren
          autorización adicional del administrador del canal mediante OAuth,
          credenciales de API, un token emitido por el comercio u otro mecanismo
          equivalente. El usuario declara contar con autorización suficiente para
          conectar y administrar cada servicio externo.
        </p>
      </section>

      <section>
        <h2>6. Inteligencia artificial</h2>
        <p>
          Global Intelligence puede utilizar proveedores externos de IA.
          En la aplicación móvil, antes de enviar una consulta y contexto del
          inventario al proveedor, se solicita una autorización independiente
          que puede revocarse desde Configuración. Las
          respuestas son asistencia operativa y pueden contener errores. Las
          decisiones comerciales, contables, fiscales, jurídicas, financieras o
          de otra naturaleza profesional siguen siendo responsabilidad de la
          persona usuaria y deben verificarse cuando corresponda.
        </p>
      </section>

      <section>
        <h2>7. Comprobantes y cuestiones fiscales</h2>
        <p>
          Los comprobantes generados dentro de Global Stock son registros
          internos salvo que exista una integración fiscal específica habilitada
          y correctamente configurada para la jurisdicción correspondiente. La
          plataforma no convierte por sí sola un registro interno en una factura
          fiscal válida ni garantiza el cumplimiento tributario de cada negocio.
        </p>
      </section>

      <section>
        <h2>8. Uso permitido</h2>
        <p>
          No está permitido utilizar Global Stock para vulnerar sistemas,
          introducir malware, acceder a cuentas o tiendas sin autorización,
          evadir controles de seguridad, abusar de APIs externas, infringir
          derechos de terceros, almacenar contenido ilícito o utilizar la
          plataforma de manera contraria a la ley.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidad y cambios</h2>
        <p>
          Global Stock puede recibir actualizaciones, mejoras, cambios de
          interfaz, mantenimiento o ajustes de compatibilidad. Algunas funciones
          pueden no estar disponibles temporalmente si dependen de terceros,
          credenciales vencidas, límites de API, conectividad o servicios fuera
          de línea. No se garantiza disponibilidad ininterrumpida.
        </p>
      </section>

      <section>
        <h2>10. Servicios de terceros</h2>
        <p>
          Shopify, Tiendanube, WooCommerce, Mercado Libre, proveedores de nube,
          autenticación, inteligencia artificial y otros servicios externos
          mantienen sus propios términos y políticas. Global Stock no controla
          sus interrupciones, cambios de API, precios ni decisiones sobre cuentas
          administradas por esos terceros.
        </p>
      </section>

      <section>
        <h2>11. Suspensión o terminación</h2>
        <p>
          El acceso puede limitarse cuando resulte necesario para proteger la
          seguridad, prevenir abuso, cumplir una obligación legal o responder a
          una vulneración grave de estos términos. Cuando sea técnicamente
          posible, se procurará permitir al usuario recuperar sus propios datos
          antes de un cierre definitivo, salvo que exista una razón legítima para
          no hacerlo.
        </p>
      </section>

      <section>
        <h2>12. Responsabilidad y límites</h2>
        <p>
          En la medida permitida por la normativa aplicable, Global Stock se
          ofrece como herramienta de apoyo a la gestión y no reemplaza los
          controles internos, copias de seguridad, asesoramiento profesional ni
          verificaciones que correspondan al negocio. Ninguna cláusula de estos
          términos excluye derechos o responsabilidades que legalmente no puedan
          excluirse.
        </p>
      </section>

      <section>
        <h2>13. Legislación y derechos obligatorios</h2>
        <p>
          Estos términos se interpretan conforme a la normativa aplicable al
          operador y al usuario. Para el operador actual, la referencia territorial
          es la Provincia de Buenos Aires, República Argentina, sin perjuicio de
          las normas obligatorias de protección al consumidor, privacidad,
          contratación o jurisdicción que puedan resultar aplicables en otros
          lugares.
        </p>
      </section>

      <section>
        <h2>14. Contacto</h2>
        <p>
          Consultas de soporte:{" "}
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>. Consultas legales o de privacidad:{" "}
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>.
        </p>
      </section>
    </LegalArticle>
  );
}