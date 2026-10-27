"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, Boxes, CheckCircle2, CircleAlert, CreditCard,
  Mic, PackageCheck, ShieldCheck, Sparkles, TrendingDown
} from "lucide-react";
import { demoProducts } from "@/lib/demo-data";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { VoiceOutputButton } from "@/components/VoiceOutputButton";

type CheckoutState = "idle" | "loading" | "complete" | "error" | "cancelled";

const money = (value: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0
}).format(value);

export function HackathonDemoClient() {
  const [question, setQuestion] = useState("¿Qué productos tengo que reponer primero?");
  const [answer, setAnswer] = useState("");
  const [checkout, setCheckout] = useState<CheckoutState>("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [paypalReady, setPaypalReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assistantBusy, setAssistantBusy] = useState(false);

  const lowStock = useMemo(
    () => demoProducts.filter((product) => product.stock <= product.minStock)
      .sort((a, b) => (a.stock - a.minStock) - (b.stock - b.minStock)),
    []
  );

  useEffect(() => {
    let active = true;
    void fetch("/api/paypal/sandbox/orders", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setPaypalReady(data?.configured === true); })
      .catch(() => { if (active) setPaypalReady(false); });

    const params = new URLSearchParams(window.location.search);
    const paypalStatus = params.get("paypal");
    const orderId = params.get("token");
    if (paypalStatus === "cancelled") {
      setCheckout("cancelled");
      setCheckoutMessage("La compra de prueba se canceló. No se realizó ningún cobro real.");
      window.history.replaceState({}, "", "/hackathon-demo");
    } else if (paypalStatus === "success" && orderId) {
      setBusy(true);
      void fetch("/api/paypal/sandbox/orders/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.code || "No se pudo confirmar la compra de prueba.");
        setCheckout("complete");
        setCheckoutMessage(`Pago de prueba confirmado en PayPal Sandbox: ${data.currency} ${data.amount}. ID: ${data.id}`);
      }).catch(() => {
        setCheckout("error");
        setCheckoutMessage("No pudimos confirmar el resultado en Sandbox. Revisá el estado del pedido antes de volver a intentar.");
      }).finally(() => {
        setBusy(false);
        window.history.replaceState({}, "", "/hackathon-demo");
      });
    }
    return () => { active = false; };
  }, []);

  async function askAssistant() {
    const prompt = question.trim();
    if (!prompt || assistantBusy) return;
    setAssistantBusy(true);
    try {
      const response = await fetch("/api/hackathon-demo/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });
      const data = await response.json();
      if (response.ok && typeof data.answer === "string") {
        setAnswer(data.answer);
        return;
      }
    } catch {
      // A local sample-data fallback keeps the demo explainable when AI is unavailable.
    } finally {
      setAssistantBusy(false);
    }

    const normalized = prompt.toLocaleLowerCase("es-AR");
    if (/repon|falt|stock|compr|proveedor|agotad/.test(normalized)) {
      const lines = lowStock.slice(0, 4).map((product, index) =>
        `${index + 1}. ${product.name}: quedan ${product.stock}, mínimo ${product.minStock}. Proveedor: ${product.supplier}.`
      );
      setAnswer(lines.length
        ? `Respuesta local de respaldo basada en datos ficticios. Priorizaría estos productos:\\n\\n${lines.join("\\n")}\\n\\nNo se creó ninguna orden ni se contactó a proveedores.`
        : "No aparecen productos por debajo del mínimo en los datos de ejemplo.");
    } else if (/venta|ingres|ganan|margen/.test(normalized)) {
      setAnswer("Esta demo usa inventario y tendencias ficticias. Para responder sobre ventas o ganancias reales, Global Intelligence necesita el contexto autorizado del negocio conectado; no voy a inventar cifras.");
    } else {
      setAnswer("La IA del servidor no está disponible en este momento. Esta respuesta de respaldo usa únicamente datos ficticios. Probá preguntarme qué productos hay que reponer.");
    }
  }

  async function startCheckout() {
    setBusy(true);
    setCheckout("loading");
    setCheckoutMessage("");
    try {
      const response = await fetch("/api/paypal/sandbox/orders", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.code || "PAYPAL_SANDBOX_ERROR");
      if (typeof data.approvalUrl !== "string" || !data.approvalUrl.startsWith("https://www.sandbox.paypal.com/")) {
        throw new Error("La URL de aprobación de Sandbox no es válida.");
      }
      window.location.assign(data.approvalUrl);
    } catch (error) {
      setCheckout("error");
      setCheckoutMessage(error instanceof Error && error.message === "PAYPAL_SANDBOX_NOT_CONFIGURED"
        ? "PayPal Sandbox todavía no está configurado en el servidor."
        : "No pudimos iniciar el checkout de prueba. No se realizó ningún cobro.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-4 py-6 text-[#17171a] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver a Global Stock">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8f0000] text-white"><Boxes size={22}/></span>
            <span><span className="block text-lg font-semibold tracking-tight">Global Stock</span><span className="block text-xs text-[#696971]">Control total para tu negocio</span></span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dedee4] bg-white px-3 py-2 text-xs font-medium text-[#56565f]"><ShieldCheck size={14}/> Demo aislada · datos ficticios</span>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_.85fr]">
          <div className="rounded-[28px] border border-[#e5e5ea] bg-white p-5 shadow-[0_16px_50px_rgba(20,20,30,.05)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#8f0000]">Panel del negocio</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Tu operación, en un solo lugar.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#686872]">Inventario, recomendaciones de Global Intelligence y un checkout PayPal en Sandbox dentro de una experiencia coherente.</p></div>
              <span className="rounded-xl bg-[#f8e9e9] px-3 py-2 text-xs font-semibold text-[#8f0000]">Modo demostración</span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f7f7f9] p-4"><p className="text-xs text-[#686872]">Productos de ejemplo</p><p className="mt-2 text-2xl font-semibold">{demoProducts.length}</p></div>
              <div className="rounded-2xl bg-[#fff4e8] p-4"><p className="text-xs text-[#8a5420]">Para revisar</p><p className="mt-2 text-2xl font-semibold text-[#8a5420]">{lowStock.length}</p></div>
              <div className="col-span-2 rounded-2xl bg-[#f7f7f9] p-4 sm:col-span-1"><p className="text-xs text-[#686872]">Entorno de pago</p><p className="mt-2 text-base font-semibold">PayPal Sandbox</p></div>
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-[#e8e8ed]">
              <div className="flex items-center justify-between border-b border-[#e8e8ed] px-4 py-3"><h2 className="text-sm font-semibold">Inventario de muestra</h2><span className="text-xs text-[#777780]">ARS · valores ilustrativos</span></div>
              <div className="divide-y divide-[#eeeeF2]">
                {demoProducts.map((product) => {
                  const critical = product.stock === 0;
                  const low = product.stock <= product.minStock;
                  return <div key={product.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_100px_110px]">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-1 truncate text-xs text-[#777780]">{product.category} · {product.supplier}</p></div>
                    <div className="text-right sm:text-left"><p className="text-sm font-medium">{product.stock} u.</p><p className="text-[11px] text-[#777780]">mín. {product.minStock}</p></div>
                    <span className={`col-span-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium sm:col-span-1 ${critical ? "bg-[#fdeaea] text-[#a21c1c]" : low ? "bg-[#fff1dd] text-[#8a5420]" : "bg-[#e8f7ef] text-[#197044]"}`}>{critical ? <CircleAlert size={12}/> : low ? <TrendingDown size={12}/> : <CheckCircle2 size={12}/>} {critical ? "Sin stock" : low ? "Stock bajo" : "Disponible"}</span>
                  </div>;
                })}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[28px] bg-[#17171b] p-5 text-white shadow-[0_16px_50px_rgba(20,20,30,.12)] sm:p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8f0000]"><Sparkles size={19}/></span><div><h2 className="font-semibold">Global Intelligence</h2><p className="mt-0.5 text-xs text-white/55">Asistente de inventario</p></div></div>
              <p className="mt-4 text-sm leading-6 text-white/70">Consultá el stock de muestra por texto o dictado. La demo identifica alertas y propone qué revisar; no modifica datos reales ni ejecuta compras.</p>
              <label htmlFor="assistant-question" className="mt-5 block text-xs font-medium text-white/70">Tu consulta</label>
              <div className="mt-2 flex gap-2">
                <textarea id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={500} className="min-w-0 flex-1 resize-y rounded-xl border border-white/15 bg-white/[.06] px-3 py-3 text-sm text-white outline-none focus:border-white/40" />
                <VoiceInputButton accentColor="#8f0000" onTranscript={(text) => setQuestion((current) => current.trim() ? `${current.trim()} ${text}` : text)} />
              </div>
              <button type="button" onClick={() => void askAssistant()} disabled={assistantBusy || !question.trim()} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#17171b] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"><Sparkles size={15}/> {assistantBusy ? "Analizando…" : "Analizar inventario"}</button>
              {answer && <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.05] p-4 text-sm leading-6 text-white/85"><div className="whitespace-pre-wrap">{answer}</div><div className="mt-3 flex justify-end"><VoiceOutputButton text={answer} compact /></div></div>}
            </section>

            <section className="rounded-[28px] border border-[#e5e5ea] bg-white p-5 shadow-[0_16px_50px_rgba(20,20,30,.05)] sm:p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f0f3ff] text-[#3454a1]"><CreditCard size={19}/></span><div><h2 className="font-semibold">Tienda online · checkout</h2><p className="mt-0.5 text-xs text-[#777780]">PayPal Developer Sandbox</p></div></div>
              <p className="mt-4 text-sm leading-6 text-[#686872]">Probá un pedido ficticio de USD 19,99. El importe está fijado en el servidor y se procesa exclusivamente en Sandbox; no es una venta real ni cambia el inventario del negocio.</p>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f7f7f9] p-4"><div><p className="text-sm font-medium">Pedido de prueba</p><p className="mt-1 text-xs text-[#777780]">1 artículo ficticio · sin envío</p></div><p className="text-lg font-semibold">US$ 19,99</p></div>
              <button type="button" onClick={() => void startCheckout()} disabled={!paypalReady || busy} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#01266a] disabled:cursor-not-allowed disabled:opacity-50"><CreditCard size={16}/>{busy ? "Conectando con Sandbox…" : paypalReady ? "Probar checkout PayPal" : "PayPal Sandbox no configurado"}<ArrowUpRight size={15}/></button>
              {!paypalReady && <p className="mt-3 text-xs leading-5 text-[#777780]">El servidor necesita PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET de una aplicación Sandbox. Las credenciales no se exponen al navegador.</p>}
              {checkoutMessage && <div role={checkout === "error" ? "alert" : "status"} className={`mt-3 rounded-xl p-3 text-xs leading-5 ${checkout === "error" ? "bg-[#fdeaea] text-[#9d2020]" : "bg-[#eef7f1] text-[#17683d]"}`}>{checkoutMessage}</div>}
              {checkout === "complete" && <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#17683d]"><PackageCheck size={15}/> Compra de prueba confirmada</div>}
              <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#777780]"><ShieldCheck size={14} className="mt-0.5 shrink-0"/> La demo está separada de las cuentas, los datos y los pagos reales de Global Stock.</p>
            </section>
          </aside>
        </section>

        <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#dedee4] pt-5 text-xs text-[#777780]"><span>Global Stock · PayPal AI Hackathon 2026</span><Link href="/" className="inline-flex items-center gap-1 font-medium text-[#8f0000] hover:underline">Volver a la aplicación <ArrowUpRight size={13}/></Link></footer>
      </div>
    </main>
  );
}
