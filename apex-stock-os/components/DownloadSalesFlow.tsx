import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Cloud,
  ReceiptText
} from "lucide-react";

const resultItems = [
  {
    icon: Boxes,
    title: "Stock",
    value: "12 → 11",
    body: "La unidad vendida se descuenta automáticamente.",
    accent: "#34d399",
    surface: "rgba(52,211,153,.10)"
  },
  {
    icon: CircleDollarSign,
    title: "Caja",
    value: "+ $48.900",
    body: "El cobro queda registrado con la misma venta.",
    accent: "#f6b95b",
    surface: "rgba(246,185,91,.10)"
  },
  {
    icon: ReceiptText,
    title: "Historial",
    value: "Guardado",
    body: "Quedan fecha, usuario, producto y medio de pago.",
    accent: "#6ea8ff",
    surface: "rgba(110,168,255,.10)"
  },
  {
    icon: Cloud,
    title: "Tienda online",
    value: "11 disponibles",
    body: "Si está conectada, las existencias también se sincronizan.",
    accent: "#b989ff",
    surface: "rgba(185,137,255,.10)"
  }
];

const benefits = [
  {
    title: "Registrás la venta una sola vez",
    body:
      "Producto, cantidad y medio de pago entran en una sola operación. Global Stock se encarga del resto."
  },
  {
    title: "Stock, caja e historial quedan alineados",
    body:
      "Cada módulo recibe el mismo movimiento sin que tengas que volver a cargar datos."
  }
];

export function DownloadSalesFlow() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
            Cómo funciona
          </p>

          <h2 className="mt-4 max-w-[640px] text-[clamp(2.15rem,4.1vw,3.65rem)] font-semibold leading-[.98] tracking-[-0.055em] text-white">
            Una venta actualiza
            <span className="block text-white/38">
              stock, caja e historial.
            </span>
          </h2>

          <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[#a8a8b0] sm:text-base">
            Registrás el producto y el medio de pago una sola vez. Global Stock
            descuenta la unidad, registra el cobro y guarda el movimiento sin
            repetir la misma información.
          </p>

          <div className="mt-8 space-y-6">
            {benefits.map((item) => (
              <div key={item.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-[#8F0000]/14 text-[#ff7b7b]">
                  <Check size={14} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-6 text-white/90">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-[560px] text-sm leading-6 text-white/46">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-white/90"
          >
            Abrir punto de venta
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-[28px] bg-[#111217] shadow-[0_28px_76px_rgba(0,0,0,.24)] ring-1 ring-white/[0.045]">
            <div className="grid min-w-0 md:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
              <div className="min-w-0 p-5 sm:p-6 lg:p-5 xl:p-6">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[.15em] text-white/30">
                      Ejemplo de venta
                    </p>
                    <h3 className="mt-2 text-[clamp(1.35rem,2.3vw,1.8rem)] font-semibold tracking-[-.04em]">
                      Venta #1048
                    </h3>
                  </div>

                  <span className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-full bg-emerald-500/10 px-3 text-[10px] font-semibold text-emerald-300">
                    <Check size={12} />
                    Confirmada
                  </span>
                </div>

                <div className="mt-7">
                  <div className="grid min-w-0 gap-3 border-b border-white/[0.055] pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold leading-6 text-white/88">
                        Reel Shimano Sedona
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/38">
                        1 unidad · SKU RS-2500
                      </p>
                    </div>
                    <p className="text-[15px] font-semibold text-white/88">
                      $ 48.900
                    </p>
                  </div>

                  <div className="grid gap-4 py-5 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[.13em] text-white/28">
                        Medio de pago
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/76">
                        Efectivo
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[.13em] text-white/28">
                        Punto de venta
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/76">
                        Caja principal
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-white/[0.055] pt-5">
                    <span className="text-sm text-white/42">Total cobrado</span>
                    <span className="text-xl font-semibold tracking-[-.04em] text-white sm:text-2xl">
                      $ 48.900
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 bg-[#0d0e12] p-5 sm:p-6 lg:border-l lg:border-white/[0.045] lg:p-5 xl:p-6">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[.15em] text-white/30">
                    Resultado
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-.035em] text-white/88">
                    Todo queda actualizado.
                  </h3>
                </div>

                <div className="mt-4">
                  {resultItems.map(({ icon: Icon, title, value, body, accent, surface }, index) => (
                    <div
                      key={title}
                      className={
                        "grid min-w-0 grid-cols-[38px_minmax(0,1fr)] gap-3 py-3.5 " +
                        (index > 0 ? "border-t border-white/[0.05]" : "")
                      }
                    >
                      <span
                        className="grid h-9 w-9 place-items-center rounded-xl"
                        style={{ background: surface, color: accent }}
                      >
                        <Icon size={16} />
                      </span>

                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <h4 className="text-[13px] font-semibold text-white/82">
                            {title}
                          </h4>
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: accent }}
                          >
                            {value}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-5 text-white/40">
                          {body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
