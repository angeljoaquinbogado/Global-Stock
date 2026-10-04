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
        <h2>1. Alcance</h2>
        <p>
          Global Stock es una plataforma de gestión empresarial. Puede utilizarse
          para administrar productos, stock, ventas, proveedores, notas,
          comprobantes internos, canales online y análisis operativos. Esta
          política se aplica a la información tratada por la plataforma y a las
          integraciones que el usuario decide habilitar.
        </p>
      </section>

      <section>
        <h2>2. Datos que puede procesar la plataforma</h2>
        <p>
          Dependiendo de las funciones utilizadas, Global Stock puede procesar
          datos de cuenta, nombre del negocio, configuración de idioma y moneda,
          productos, códigos de barras, costos, precios, cantidades de stock,
          ventas, actividad operativa, proveedores, notas y comprobantes
          internos. Si se conecta una tienda online, también puede recibir los
          datos que ese canal autorice expresamente.
        </p>
      </section>

      <section>
        <h2>3. Integraciones con ecommerce</h2>
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
          catálogo, consultar inventario o modificar stock. El usuario puede
          revocar la integración desde el sistema que emitió las credenciales.
        </p>
      </section>

      <section>
        <h2>4. Inteligencia artificial</h2>
        <p>
          Cuando Global Intelligence está habilitada, la consulta del usuario y
          el contexto necesario para responder pueden enviarse al proveedor de
          IA configurado por la plataforma. Global Stock puede utilizar
          proveedores de IA externos, incluido Google Gemini u otros proveedores
          compatibles que se configuren en el servidor. Las claves de acceso a
          esos servicios se mantienen exclusivamente del lado del servidor. Ese
          contexto puede incluir, cuando sea pertinente, inventario, ventas,
          actividad, notas, pedidos online y métricas del negocio. Global Stock
          procura enviar únicamente la información necesaria para la función
          solicitada.
        </p>
      </section>

      <section>
        <h2>5. Almacenamiento local y sesiones</h2>
        <p>
          Algunas preferencias y datos de uso local pueden almacenarse en el
          navegador mediante mecanismos como localStorage. Las credenciales
          sensibles de conectores privados no deben almacenarse como texto
          legible en localStorage. Cuando una integración requiere una sesión
          privada, la aplicación puede utilizar cookies HttpOnly cifradas del
          lado del servidor.
        </p>
      </section>

      <section>
        <h2>6. Finalidades del tratamiento</h2>
        <p>
          La información se utiliza para prestar las funciones solicitadas,
          sincronizar canales autorizados, conservar configuraciones, mantener
          la seguridad, detectar errores, ejecutar análisis operativos y mejorar
          la experiencia de uso. Global Stock no debe presentar datos demo como
          si fueran datos reales de un negocio conectado.
        </p>
      </section>

      <section>
        <h2>7. Proveedores y servicios externos</h2>
        <p>
          La plataforma puede depender de proveedores de infraestructura,
          autenticación, base de datos, despliegue, correo, inteligencia
          artificial, pagos o ecommerce. Algunos proveedores pueden procesar
          información desde otros países o regiones. Cada servicio externo puede
          aplicar sus propias condiciones y políticas a los datos que reciba
          directamente, y Global Stock debe revisar esos proveedores cuando
          cambien las integraciones o la infraestructura.
        </p>
      </section>

      <section>
        <h2>8. Conservación y eliminación</h2>
        <p>
          Los datos deben conservarse mientras sean necesarios para prestar el
          servicio, cumplir obligaciones aplicables o mantener registros
          legítimos de seguridad y operación. Cuando el producto incorpore
          funciones de eliminación de cuenta o negocio, la eliminación se
          realizará respetando respaldos temporales, obligaciones legales y
          registros que deban conservarse.
        </p>
      </section>

      <section>
        <h2>9. Seguridad</h2>
        <p>
          Se aplican medidas técnicas y organizativas razonables para reducir el
          riesgo de acceso no autorizado, pérdida o alteración de datos. Ningún
          sistema puede garantizar seguridad absoluta. Más detalles se publican
          en la página de Seguridad.
        </p>
      </section>

      <section>
        <h2>10. Derechos y consultas</h2>
        <p>
          Las personas pueden solicitar información, corrección o eliminación
          de datos cuando corresponda conforme a las normas aplicables. El
          operador actual es Angel Joaquin Bogado, Provincia de Buenos Aires,
          Argentina. Las consultas de privacidad o eliminación pueden enviarse a{" "}
          <a href="mailto:joaquinbogado555@gmail.com">
            joaquinbogado555@gmail.com
          </a>. Para soporte general puede utilizarse{" "}
          <a href="mailto:angeljoaquinbogado@gmail.com">
            angeljoaquinbogado@gmail.com
          </a>.
        </p>
      </section>

      <section>
        <h2>11. Cambios</h2>
        <p>
          Esta política puede actualizarse cuando cambien las funciones,
          proveedores o requisitos aplicables. La fecha visible al inicio de la
          página indica la versión vigente publicada.
        </p>
      </section>
    </LegalArticle>
  );
}
