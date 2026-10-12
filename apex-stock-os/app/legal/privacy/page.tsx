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
      intro="Versión 2026-10-12-v5. Esta política describe qué información puede procesar Global Stock al crear una cuenta, administrar un negocio, conectar servicios, preparar datos fiscales y utilizar inteligencia artificial. La app móvil registra su aceptación por versión."
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
          datos de cuenta, nombre y perfil del negocio, declaración de operación en Argentina para la beta, configuración de idioma y
          moneda, productos, códigos de barras, costos, precios, cantidades de
          stock, ventas, actividad operativa, clientes, proveedores, notas,
          comprobantes internos, datos fiscales que el comerciante decida aportar
          (incluidos razón social, CUIT, condición impositiva, domicilio y punto
          de venta), solicitudes de vinculación con dominios públicos de tiendas
          y datos recibidos desde integraciones autorizadas.
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
          IA configurado por la plataforma. En la app móvil, antes de enviar
          contexto comercial, se solicita un permiso explícito e independiente
          para el negocio seleccionado. Se registra si ese permiso está
          activo y se puede revocar desde Configuración. La revocación
          impide nuevos envíos desde la app móvil, pero no elimina
          automáticamente datos que un proveedor haya procesado anteriormente,
          los cuales se gestionan conforme a los acuerdos y políticas aplicables.
          Global Stock puede utilizar
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
          almacenarse en el dispositivo mediante mecanismos como localStorage
          (web) o bases SQLite locales (aplicación móvil). En la primera beta, esas copias SQLite de inventario, negocios y presupuestos no están cifradas en reposo: no deben utilizarse para datos confidenciales. Al cerrar sesión en ese dispositivo, previa confirmación, la app intenta eliminar las copias locales asociadas a la cuenta; los datos de Supabase permanecen. En iPhone y Android,
          la app utiliza almacenamiento protegido del sistema para mantener
          la sesión de autenticación.
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
        <h2>Cookies, servicios externos y medición</h2>
        <p>
          Además de los registros técnicos de los proveedores de infraestructura,
          el navegador puede conservar sesión, preferencias, datos temporales y
          recursos de funcionamiento sin conexión. La página{" "}
          <a href="/legal/cookies">Cookies y almacenamiento</a>{" "}
          detalla las finalidades y las opciones disponibles. Las herramientas
          opcionales de medición o publicidad no deben activarse sin ofrecer los
          controles y la información correspondientes.
        </p>
      </section>
      <section>
        <h2>Correos de novedades</h2>
        <p>
          Los correos de inicio de sesión, seguridad y soporte son
          independientes de los boletines de novedades. Desde Configuración,
          una persona autenticada puede registrar voluntariamente si desea
          recibir noticias sobre funciones nuevas de Global Stock. Se
          almacena el correo de su cuenta, su decisión, la fecha de aceptación
          o baja y un token aleatorio usado exclusivamente para tramitar bajas
          sin iniciar sesión. Nadie es suscripto automáticamente por registrarse.
          El sistema de envío de campañas todavía no está activado; cuando
          exista un remitente verificado, cada correo incluirá un enlace visible
          de baja gratuita y un mecanismo de cancelación de un clic.
          Revocar la suscripción no afecta la cuenta ni los avisos necesarios
          para la seguridad del servicio.
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
          La persona autenticada puede iniciar la eliminación de su cuenta
          directamente desde la página de Soporte de Global Stock. El flujo
          exige confirmar el correo de la cuenta y una frase de eliminación. Si
          la cuenta es propietaria de un espacio compartido con otros miembros,
          primero debe transferir esa propiedad para evitar borrar datos de
          terceros. Cuando la cuenta es la única propietaria de un espacio, la
          eliminación de la cuenta también elimina ese espacio y los datos
          asociados. Determinados registros pueden conservarse únicamente cuando
          exista una obligación legal o un motivo legítimo documentado.
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
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>. Soporte general:{" "}
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>.
        </p>
      </section>

      <section>
        <h2>12. Menores y capacidad para utilizar el servicio</h2>
        <p>
          Global Stock está orientado a actividades comerciales y no está
          destinado a menores. En la versión móvil actual exigimos una
          declaración de que la persona tiene 18 años o más antes del uso.
          Esta declaración no equivale a una comprobación documental de edad.
          Las exigencias de verificación, consentimiento o protección de
          menores pueden variar por país y deben evaluarse antes de cada
          lanzamiento regional.
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