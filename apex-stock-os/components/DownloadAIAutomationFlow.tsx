import {
  BadgeCheck,
  BrainCircuit,
  ChevronRight,
  FileUp,
  ScanLine,
  Sparkles
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Subí o conectá",
    body:
      "Cargá una foto o PDF de una factura, ticket o comprobante. Global Stock prepara el documento para analizarlo sin volver a escribir los datos.",
    icon: FileUp,
    detailIcon: ScanLine,
    detail: "Imágenes y PDF"
  },
  {
    number: "02",
    title: "La IA lee, categoriza y relaciona",
    body:
      "Global Intelligence reconoce proveedor, fecha, número, subtotal, impuestos, total, moneda, categoría e ítems, y lo vincula con el contexto disponible del negocio.",
    icon: BrainCircuit,
    detailIcon: Sparkles,
    detail: "Datos estructurados con IA"
  },
  {
    number: "03",
    title: "Revisá y aprobá",
    body:
      "Vos mantenés el control. Corregí cualquier dato, validá la sugerencia y dejá el comprobante aprobado antes de usarlo en tu operación.",
    icon: BadgeCheck,
    detailIcon: BadgeCheck,
    detail: "Validación humana"
  }
];

export function DownloadAIAutomationFlow() {
  return (
    <section className="gs-ai-automation border-t border-white/[0.045]">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="gs-download-kicker text-[10px] font-bold uppercase tracking-[.17em] text-[#8F0000]">
            Document Intelligence
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            De comprobante a dato útil.
            <span className="block text-white/34">Sin cargar todo a mano.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#a8a8b0] sm:text-base sm:leading-7">
            La IA ya puede leer comprobantes y convertirlos en información estructurada
            para que revises antes de seguir. El objetivo es automatizar el trabajo repetitivo
            sin sacarte el control.
          </p>
        </div>

        <div className="relative mt-12 grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-1/2 hidden h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(143,0,0,.22),rgba(143,0,0,.22),transparent)] lg:block" />

          {steps.map(({ number, title, body, icon: Icon, detailIcon: DetailIcon, detail }, index) => (
            <article
              key={number}
              className="gs-ai-automation-card group relative z-10 overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#111217] p-5 shadow-[0_24px_70px_rgba(0,0,0,.14)] transition-[transform,border-color,background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)] hover:-translate-y-1 hover:border-[#8F0000]/35 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="gs-ai-automation-icon grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-[#8F0000] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
                  <Icon size={19} />
                </span>
                <span className="grid h-8 min-w-8 place-items-center rounded-full border border-white/[0.06] bg-white/[0.035] px-2 text-[10px] font-bold tracking-[.08em] text-white/36">
                  {number}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold tracking-[-.035em] sm:text-2xl">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/46">
                {body}
              </p>

              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-white/52">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
                  <DetailIcon size={13} />
                </span>
                {detail}
              </div>

              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,#8F0000,transparent)] transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:scale-x-100" />

              {index < steps.length - 1 ? (
                <span className="absolute -right-[19px] top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/[0.07] bg-[#0b0b0d] text-white/24 shadow-lg lg:grid">
                  <ChevronRight size={15} />
                </span>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
