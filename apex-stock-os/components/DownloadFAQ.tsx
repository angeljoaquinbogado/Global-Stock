const faqs = [
  {
    q: "¿Global Stock ya se puede instalar?",
    a: "Sí. La versión web funciona como PWA y puede instalarse desde navegadores compatibles. Las publicaciones nativas se mostrarán como disponibles únicamente cuando estén aprobadas."
  },
  {
    q: "¿Sirve solo para comercios?",
    a: "No. La estructura actual contempla comercios, gastronomía, ecommerce, mayoristas, servicios, industria y también asesorías o estudios que necesiten clientes, documentos, finanzas, agenda y seguimiento."
  },
  {
    q: "¿Puedo conectar una tienda online?",
    a: "Global Stock puede detectar información pública de una tienda y, cuando existe una integración compatible, requerir una autorización adicional antes de sincronizar datos privados o modificar stock."
  },
  {
    q: "¿Hay control por roles?",
    a: "Sí. La aplicación contempla perfiles como dueño, administrador, gerente, caja, depósito, ventas, contador y solo lectura, con acceso distinto según el rol."
  },
  {
    q: "¿Global Intelligence usa datos del negocio?",
    a: "La IA está diseñada para trabajar con contexto de inventario, ventas, costos, márgenes, actividad, notas y otros datos disponibles dentro de Global Stock."
  }
];

export function DownloadFAQ() {
  return (
    <section className="bg-[#0b0b0c] text-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
            Preguntas frecuentes
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Lo importante, claro.
          </h2>
        </div>

        <div className="mt-10 divide-y divide-[#24171a] border-y border-[#24171a]">
          {faqs.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-base font-semibold sm:text-lg">
                <span>{item.q}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#342025] text-white/40 transition group-open:rotate-45 group-open:bg-white group-open:text-black">
                  +
                </span>
              </summary>
              <p className="max-w-3xl pb-6 pr-12 text-sm leading-7 text-white/52">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
