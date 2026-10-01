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
      intro="Estos términos regulan el acceso y uso de Global Stock. Al crear una cuenta, instalar la aplicación o conectar un negocio, la persona usuaria acepta estas reglas en la medida permitida por la normativa aplicable."
    >
      <section>
        <h2>1. Operador</h2>
        <p>
          Global Stock es un proyecto de software creado y operado actualmente
          por <strong>Angel Joaquin Bogado</strong>, con base en la Provincia de
          Buenos Aires, Argentina. Global Stock no constituye hoy una sociedad
          separada del operador. Para soporte puede escribirse a{" "}
          <a href="mailto:angeljoaquinbogado@gmail.com">
            angeljoaquinbogado@gmail.com
          </a>{" "}
          y para asuntos legales o de privacidad a{" "}
          <a href="mailto:joaquinbogado555@gmail.com">
            joaquinbogado555@gmail.com
          </a>.
        </p>
      </section>

      <section>
        <h2>2. Finalidad del servicio</h2>
        <p>
          Global Stock ofrece herramientas para organizar inventario, ventas,
          punto de venta, proveedores, reposición, códigos de barras, ecommerce,
          comprobantes internos, notas, cotizaciones e inteligencia operativa.
          Algunas funciones pueden depender de servicios externos o de una
          integración autorizada por el usuario.
        </p>
      </section>

      <section>
        <h2>3. Cuenta y seguridad</h2>
        <p>
          La persona usuaria es responsable de mantener seguras sus credenciales,
          de utilizar datos correctos y de impedir accesos no autorizados a su
          cuenta. No deben compartirse contraseñas, claves de servicio ni tokens
          de integración fuera de los canales previstos por la plataforma.
        </p>
      </section>

      <section>
        <h2>4. Datos del negocio</h2>
        <p>
          El usuario conserva la responsabilidad sobre la exactitud de los datos
          cargados o sincronizados, incluidos costos, precios, stock, proveedores
          y movimientos. Global Stock no debe completar como hechos reales los
          datos que no hayan sido suministrados o verificados.
        </p>
      </section>

      <section>
        <h2>5. Integraciones y propiedad de tiendas</h2>
        <p>
          Detectar una URL pública no concede permiso para leer información
          privada ni modificar stock. Las funciones de sincronización requieren
          una autorización adicional del administrador del canal, mediante OAuth,
          credenciales de API, un token emitido por el comercio u otro mecanismo
          equivalente. El usuario declara contar con autorización suficiente para
          conectar y administrar cada servicio externo.
        </p>
      </section>

      <section>
        <h2>6. Inteligencia artificial</h2>
        <p>
          Global Intelligence puede utilizar un proveedor externo de IA para
          responder consultas. Sus respuestas son asistencia operativa y pueden
          contener errores. Las decisiones comerciales, contables, fiscales,
          jurídicas o financieras siguen siendo responsabilidad de la persona
          usuaria y deben verificarse cuando corresponda.
        </p>
      </section>

      <section>
        <h2>7. Comprobantes y cuestiones fiscales</h2>
        <p>
          Los comprobantes generados dentro de Global Stock son registros
          internos salvo que exista una integración fiscal específica habilitada
          para la jurisdicción correspondiente. La plataforma no convierte por sí
          sola un registro interno en una factura fiscal válida.
        </p>
      </section>

      <section>
        <h2>8. Uso permitido</h2>
        <p>
          No está permitido utilizar Global Stock para vulnerar sistemas,
          introducir malware, intentar acceder a cuentas o tiendas sin
          autorización, evadir controles de seguridad, abusar de APIs externas o
          utilizar la plataforma de manera contraria a la ley.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidad y cambios</h2>
        <p>
          Global Stock puede recibir actualizaciones, mejoras, cambios de
          interfaz, mantenimiento o ajustes de compatibilidad. Algunas funciones
          pueden no estar disponibles temporalmente si dependen de terceros,
          credenciales vencidas, límites de API o servicios fuera de línea.
        </p>
      </section>

      <section>
        <h2>10. Servicios de terceros</h2>
        <p>
          Shopify, Tiendanube, WooCommerce, Mercado Libre, proveedores de nube,
          autenticación, inteligencia artificial y otros servicios externos
          mantienen sus propios términos y políticas. Global Stock no controla
          sus interrupciones, cambios de API ni decisiones sobre cuentas
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
        <h2>12. Legislación aplicable</h2>
        <p>
          Estos términos se interpretan conforme a la normativa aplicable al
          operador y al usuario. Para el operador actual, la referencia territorial
          es la Provincia de Buenos Aires, República Argentina, sin perjuicio de
          las normas de protección al consumidor, privacidad o jurisdicción que
          puedan resultar obligatorias en otros lugares.
        </p>
      </section>

      <section>
        <h2>13. Contacto</h2>
        <p>
          Consultas de soporte:{" "}
          <a href="mailto:angeljoaquinbogado@gmail.com">
            angeljoaquinbogado@gmail.com
          </a>. Consultas legales o de privacidad:{" "}
          <a href="mailto:joaquinbogado555@gmail.com">
            joaquinbogado555@gmail.com
          </a>.
        </p>
      </section>
    </LegalArticle>
  );
}
