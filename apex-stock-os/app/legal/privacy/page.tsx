import type { Metadata } from "next";

import { LegalArticle } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Privacidad — Global Stock",
  description:
    "Política de privacidad y tratamiento de datos de Global Stock."
};

export default function PrivacyPage() {
  return (
    <LegalArticle
      eyebrow="Privacidad"
      title="Política de privacidad"
      intro="Esta política describe qué información puede procesar Global Stock cuando una persona crea una cuenta, administra un negocio, conecta servicios externos o utiliza funciones de inteligencia artificial."
    >
      <section>
        <h2>1. Responsable y alcance</h2>
        <p>
          Global Stock es un producto de software operado actualmente por{" "}
          <strong>Angel Joaquin Bogado</strong>, Provincia de Buenos Aires,
          Argentina. Esta política se aplica a la información tratada por la
          plataforma y a las integraciones que el usuario decide habilitar.
        </p>
      </section>

      <section>
        <h2>2. Datos que puede procesar la plataforma</h2>
        <p>
          Dependiendo de las funciones utilizadas, Global Stock puede procesar
          datos de cuenta, nombre y perfil del negocio, configuración de idioma y
          moneda, productos, códigos de barras, costos, precios, cantidades de
          stock, ventas, actividad operativa, clientes, proveedores, notas,
          comprobantes internos y datos recibidos desde integraciones autorizadas.
          Los proveedores de infraestructura también pueden registrar datos
          técnicos necesarios para operar y proteger el servicio, como dirección
          IP, agente de usuario, fecha, ruta solicitada y registros de errores.
        </p>
      </section>

      <section>
        <h2>3. Finalidades y fundamento del tratamiento</h2>
        <p>
          Los datos se utilizan para prestar las funciones solicitadas, autenticar
          cuentas, sincronizar canales autorizados, conservar configuraciones,
          mantener la seguridad, prevenir abuso, registrar operaciones, resolver
          errores y ofrecer análisis operativos. Cuando corresponda, el
          tratamiento puede basarse en la ejecución del servicio solicitado, el
          cumplimiento de obligaciones aplicables, intereses legítimos de
          seguridad y operación, o el consentimiento cuando una función requiera
          una autorización específica.
        </p>
      </section>

      <section>
        <h2>4. Integraciones con ecommerce</h2>
        <p>
          Una URL pública permite reconocer una tienda y consultar únicamente
          información pública disponible. <strong>La URL por sí sola no habilita
          acceso a datos privados ni modificaciones de stock.</strong> Para
          sincronizar información privada Global Stock exige una autorización
          adicional, como un token emitido por el administrador del comercio o
          un flujo OAuth/API equivalente.
        </p>
        <p className="mt-3">
          Los permisos pueden limitarse a acciones concretas, por ejemplo leer
          catálogo, consultar inventario o modificar stock. La integración puede
          revocarse mediante los mecanismos disponibles en Global Stock o en el
          servicio externo que emitió la credencial.
        </p>
      </section>

      <section>
        <h2>5. Inteligencia artificial</h2>
        <p>
          Cuando Global Intelligence está habilitada, la consulta del usuario y
          el contexto necesario para responder pueden enviarse al proveedor de
          IA configurado por la plataforma. Global Stock puede utilizar
          proveedores externos, incluido Google Gemini u otros proveedores
          compatibles configurados en el servidor. Las claves de acceso a esos
          servicios permanecen del lado del servidor.
        </p>
        <p className="mt-3">
          El contexto enviado puede incluir inventario, ventas, actividad, notas,
          pedidos online y métricas cuando sean pertinentes para la consulta.
          Global Stock procura limitar ese contexto a la información necesaria.
          Las respuestas de IA son asistencia y pueden contener errores; no
          sustituyen asesoramiento profesional ni deben utilizarse como única base
          para decisiones con efectos jurídicos, fiscales, médicos, crediticios o
          similares.
        </p>
      </section>

      <section>
        <h2>6. Almacenamiento local y sesiones</h2>
        <p>
          Algunas preferencias y operaciones pendientes de sincronización pueden
          almacenarse en el dispositivo mediante mecanismos como localStorage.
          Ese almacenamiento se trata como información no confiable al volver a
          sincronizarse con el servidor. Las credenciales sensibles de conectores
          privados no deben guardarse como texto legible en localStorage. Las
          sesiones privadas pueden utilizar cookies HttpOnly protegidas y
          cifradas del lado del servidor.
        </p>
      </section>

      <section>
        <h2>7. Proveedores, encargados y transferencias internacionales</h2>
        <p>
          La plataforma puede depender de proveedores de infraestructura,
          autenticación, base de datos, despliegue, correo, inteligencia
          artificial, pagos o ecommerce. Algunos proveedores pueden procesar
          información desde otros países o regiones. Cuando resulte aplicable,
          Global Stock debe utilizar mecanismos contractuales, técnicos u otros
          instrumentos válidos para esas transferencias y revisar el alcance de
          cada proveedor cuando cambie la infraestructura.
        </p>
      </section>

      <section>
        <h2>8. Seguridad</h2>
        <p>
          Se aplican medidas técnicas y organizativas razonables para reducir el
          riesgo de acceso no autorizado, pérdida, alteración o uso indebido de
          datos. Entre ellas pueden incluirse controles de acceso, aislamiento por
          negocio, validación de entradas, cifrado de sesiones y restricciones a
          credenciales de servidor. Ningún sistema conectado a Internet puede
          garantizar seguridad absoluta.
        </p>
      </section>

      <section>
        <h2>9. Conservación</h2>
        <p>
          Los datos se conservan mientras sean necesarios para prestar el
          servicio, mantener registros legítimos de seguridad y operación, o
          cumplir obligaciones aplicables. Los períodos pueden variar según el
          tipo de información, la relación con el usuario, respaldos temporales y
          requisitos legales. Los datos que ya no sean necesarios deben
          eliminarse o anonimizarse cuando corresponda.
        </p>
      </section>

      <section>
        <h2>10. Eliminación de cuenta y datos</h2>
        <p>
          Actualmente puede solicitarse el cierre de la cuenta y la eliminación
          de los datos asociados escribiendo a{" "}
          <a href="mailto:joaquinbogado555@gmail.com">
            joaquinbogado555@gmail.com
          </a>. La solicitud puede requerir verificación de identidad o de control
          del negocio. La eliminación está sujeta a respaldos temporales,
          prevención de fraude, seguridad y registros que deban conservarse por
          una obligación legal o motivo legítimo documentado.
        </p>
      </section>

      <section>
        <h2>11. Derechos y consultas</h2>
        <p>
          Según la normativa que resulte aplicable, una persona puede solicitar
          acceso, corrección, actualización, portabilidad, oposición,
          restricción o eliminación de sus datos. Algunas solicitudes pueden no
          corresponder en todas las jurisdicciones o pueden estar sujetas a
          excepciones legales. Consultas de privacidad:{" "}
          <a href="mailto:joaquinbogado555@gmail.com">
            joaquinbogado555@gmail.com
          </a>. Soporte general:{" "}
          <a href="mailto:angeljoaquinbogado@gmail.com">
            angeljoaquinbogado@gmail.com
          </a>.
        </p>
      </section>

      <section>
        <h2>12. Menores y capacidad para utilizar el servicio</h2>
        <p>
          Global Stock está orientado a la gestión de actividades comerciales y
          no está dirigido específicamente a niños. Quien cree o administre una
          cuenta debe tener capacidad legal suficiente para hacerlo o contar con
          la autorización de su representante cuando la legislación aplicable lo
          exija.
        </p>
      </section>

      <section>
        <h2>13. Responsabilidad sobre datos de terceros</h2>
        <p>
          Si un negocio carga datos de clientes, empleados, proveedores u otras
          personas, quien administra ese negocio es responsable de contar con una
          base válida para incorporarlos y de utilizar Global Stock de acuerdo
          con sus propias obligaciones de privacidad. La plataforma no autoriza
          recopilar datos de terceros de forma ilícita.
        </p>
      </section>

      <section>
        <h2>14. Cambios</h2>
        <p>
          Esta política puede actualizarse cuando cambien las funciones,
          proveedores o requisitos aplicables. La fecha visible en el documento
          indica la versión vigente publicada. Los cambios materiales deben
          comunicarse de forma razonable cuando corresponda.
        </p>
      </section>
    </LegalArticle>
  );
}
