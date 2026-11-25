"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Globe } from "lucide-react";

type Id = "ios" | "android" | "windows" | "mac" | "web";
type Stores = { appStore: string; playStore: string; microsoftStore: string };
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DEVICES: { id: Id; name: string; sub: string; icon: string; steps: string[] }[] = [
  { id: "ios", name: "iPhone y iPad", sub: "Desde Safari", icon: "/platforms/apple.png",
    steps: ["Abrí esta página en Safari.", "Tocá el botón Compartir.", "Elegí «Agregar a pantalla de inicio» y confirmá."] },
  { id: "android", name: "Android", sub: "Desde Chrome", icon: "/platforms/android.png",
    steps: ["Abrí esta página en Chrome.", "Tocá el menú ⋮, arriba a la derecha.", "Elegí «Instalar app» o «Agregar a la pantalla de inicio»."] },
  { id: "windows", name: "Windows", sub: "Desde Edge o Chrome", icon: "/platforms/windows.png",
    steps: ["Abrí esta página en Edge o Chrome.", "Buscá el ícono de instalar en la barra de direcciones.", "Si no aparece: menú ⋯ → Aplicaciones → Instalar este sitio como aplicación."] },
  { id: "mac", name: "Mac", sub: "Desde Chrome, Edge o Safari", icon: "/platforms/apple.png",
    steps: ["En Chrome o Edge: ícono de instalar en la barra de direcciones.", "En Safari: menú Archivo → Agregar al Dock.", "Si no aparece la opción, actualizá el navegador."] },
  { id: "web", name: "Navegador", sub: "Sin instalar", icon: "", steps: [] }
];

function detect(): Id | null {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Macintosh/.test(ua)) return "mac";
  return null;
}

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/* Un botón por dispositivo: instala con un toque donde el navegador lo permite, explica los pasos donde no,
   y abre la tienda cuando hay enlace (NEXT_PUBLIC_*_STORE_URL). */
export function DeviceButtons({ stores }: { stores: Stores }) {
  const uid = useId();
  const promptRef = useRef<InstallEvent | null>(null);
  const [me, setMe] = useState<Id | null>(null);
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [open, setOpen] = useState<Id | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setMe(detect());
    setInstalled(isInstalledApp());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as InstallEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setCanPrompt(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    const ev = promptRef.current;
    if (!ev) return;
    setStatus("");
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      setStatus(outcome === "accepted" ? "Listo, se está instalando." : "Cancelaste la instalación. Puedes intentarlo de nuevo cuando quieras.");
    } catch {
      // El navegador puede rechazar el aviso (por ejemplo, si ya se usó): se explica y se muestran los pasos manuales.
      setStatus("El navegador no pudo abrir el instalador. Usa el menú del navegador y elige «Instalar app».");
    } finally {
      promptRef.current = null;
      setCanPrompt(false);
    }
  }

  const storeOf: Partial<Record<Id, string>> = { ios: stores.appStore, android: stores.playStore, windows: stores.microsoftStore };

  return (
    <>
      <ul className="dx-devices">
        {DEVICES.map((d) => {
          const mine = d.id === me;
          const store = storeOf[d.id] ?? "";
          const panel = `${uid}-${d.id}`;
          const isOpen = open === d.id;
          let action: ReactNode;
          if (d.id === "web") {
            action = (
              <Link href="/" className="dx-dbtn dx-dbtn--primary">
                Abrir ahora <ArrowRight size={16} aria-hidden="true" />
              </Link>
            );
          } else if (store) {
            action = (
              <a href={store} target="_blank" rel="noopener noreferrer" className="dx-dbtn dx-dbtn--primary">
                Abrir en la tienda <ArrowRight size={16} aria-hidden="true" />
              </a>
            );
          } else if (mine && installed) {
            action = (
              <Link href="/" className="dx-dbtn dx-dbtn--primary">
                <Check size={16} aria-hidden="true" /> Ya está instalada · Abrir
              </Link>
            );
          } else if (mine && canPrompt) {
            action = (
              <button type="button" onClick={install} className="dx-dbtn dx-dbtn--primary">
                Instalar ahora
              </button>
            );
          } else {
            action = (
              <button type="button" className="dx-dbtn" aria-expanded={isOpen} aria-controls={panel} onClick={() => setOpen(isOpen ? null : d.id)}>
                Ver cómo <ChevronDown size={16} aria-hidden="true" className="dx-dbtn__chev" />
              </button>
            );
          }
          return (
            <li key={d.id}>
              <article className={mine ? "dx-device is-me" : "dx-device"}>
                {mine && <span className="dx-device__tag">Tu dispositivo</span>}
                <span className="dx-chip">
                  {d.icon ? <img src={d.icon} alt="" width={128} height={128} loading="lazy" decoding="async" /> : <Globe size={30} strokeWidth={1.6} aria-hidden="true" />}
                </span>
                <div>
                  <strong>{d.name}</strong>
                  <small>{d.sub}</small>
                </div>
                {action}
                {d.steps.length > 0 && !store && (
                  <div id={panel} className={isOpen ? "dx-steps is-open" : "dx-steps"}>
                    <div>
                      <ol>
                        {d.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>
      <p role="status" className="dx-status">{status}</p>
      <p className="dx-consent">
        Al instalar o usar Global Stock aceptás los <Link href="/legal/terms">Términos</Link> y la{" "}
        <Link href="/legal/privacy">Política de privacidad</Link>. Más sobre{" "}
        <Link href="/legal/cookies">cookies y almacenamiento</Link>.
      </p>
    </>
  );
}
