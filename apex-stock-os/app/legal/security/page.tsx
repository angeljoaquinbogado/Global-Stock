import type { Metadata } from "next";

import { LegalArticle } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Seguridad — Global Stock",
  description: "Principios de seguridad y protección de accesos en Global Stock."
};

export default function SecurityPage() {
  return (
    <LegalArticle
      eyebrow="Seguridad"
      title="Seguridad y conexiones"
      intro="Global Stock está diseñado para separar los datos públicos de las credenciales privadas y exigir autorización antes de modificar sistemas externos."
    >
      <section>
        <h2>1. Principio de autorización</h2>
        <p>
          Una tienda pública puede ser detectada mediante su URL, pero esa
          detección no concede permisos administrativos. La lectura privada o
          modificación de stock requiere una credencial emitida por el canal o
          un flujo de autorización válido.
        </p>
      </section>

      <section>
        <h2>2. Credenciales sensibles</h2>
        <p>
          Las claves de servidor, tokens privados y secretos de proveedores no
          deben exponerse en el código del navegador ni almacenarse como texto
          legible en localStorage. Las conexiones privadas deben mantenerse en el
          servidor, en variables de entorno o en sesiones protegidas.
        </p>
      </section>

      <section>
        <h2>3. Sesiones de tiendas conectadas</h2>
        <p>
          Cuando Global Stock utiliza un token de conexión para un ecommerce
          compatible, la sesión puede mantenerse mediante una cookie HttpOnly
          cifrada. Esto evita entregar el token al JavaScript del navegador. El
          comercio puede revocar la integración desde el sistema que emitió la
          credencial.
        </p>
      </section>

      <section>
        <h2>4. Permisos mínimos</h2>
        <p>
          Las integraciones deben solicitar únicamente los permisos necesarios.
          Leer catálogo, leer inventario, modificar inventario o leer pedidos son
          capacidades distintas y pueden administrarse de forma separada cuando
          el proveedor lo permite.
        </p>
      </section>

      <section>
        <h2>5. Validación de URLs y conexiones</h2>
        <p>
          Los servicios del servidor deben rechazar destinos locales, privados o
          inesperados cuando inspeccionan una URL externa. Los redireccionamientos
          y respuestas remotas se validan antes de utilizarse para reducir riesgos
          como accesos de red no autorizados.
        </p>
      </section>

      <section>
        <h2>6. Datos y autenticación</h2>
        <p>
          Las cuentas productivas deben utilizar autenticación real y controles
          de acceso adecuados. Cuando se habilita una base de datos multiusuario,
          cada negocio debe quedar aislado mediante reglas de autorización y
          políticas de acceso por usuario o rol.
        </p>
      </section>

      <section>
        <h2>7. Inteligencia artificial</h2>
        <p>
          Las credenciales del proveedor de IA permanecen del lado del servidor.
          El navegador envía la consulta a Global Stock y el servidor realiza la
          llamada al proveedor configurado. No debe utilizarse una clave secreta
          de IA con un prefijo público ni incluirla en el bundle del cliente.
        </p>
      </section>

      <section>
        <h2>8. Reporte de vulnerabilidades</h2>
        <p>
          Si encontrás una vulnerabilidad o un comportamiento que pueda exponer
          datos, credenciales o permisos de otro usuario, informalo de forma
          responsable a{" "}
          <a href="mailto:support.globalstock@gmail.com">
            support.globalstock@gmail.com
          </a>{" "}
          con una descripción reproducible. Evitá acceder, copiar o alterar datos
          que no te pertenecen.
        </p>
      </section>

      <section>
        <h2>9. Límites</h2>
        <p>
          Ningún sistema conectado a Internet puede garantizar seguridad
          absoluta. Global Stock debe mantenerse actualizado y sus dependencias,
          permisos, credenciales y servicios externos deben revisarse
          periódicamente.
        </p>
      </section>
    </LegalArticle>
  );
}