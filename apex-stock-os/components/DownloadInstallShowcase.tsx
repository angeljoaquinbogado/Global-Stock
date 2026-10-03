"use client";

import {
  Check,
  Download,
  Laptop,
  MonitorDown,
  Smartphone,
  TabletSmartphone
} from "lucide-react";
import { useState } from "react";

import { InstallAppButton } from "@/components/InstallAppButton";

type PlatformId = "web" | "iphone" | "android" | "windows";

type Props = {
  appStoreUrl: string;
  playStoreUrl: string;
  microsoftStoreUrl: string;
};

const platforms: Array<{
  id: PlatformId;
  label: string;
  eyebrow: string;
  icon: typeof Smartphone;
  accent: string;
  surface: string;
}> = [
  {
    id: "web",
    label: "Web / PWA",
    eyebrow: "Disponible ahora",
    icon: MonitorDown,
    accent: "#ff3b45",
    surface: "rgba(255,59,69,.10)"
  },
  {
    id: "iphone",
    label: "iPhone / iPad",
    eyebrow: "Safari",
    icon: Smartphone,
    accent: "#7aa2ff",
    surface: "rgba(122,162,255,.10)"
  },
  {
    id: "android",
    label: "Android",
    eyebrow: "Chrome",
    icon: TabletSmartphone,
    accent: "#4fd39a",
    surface: "rgba(79,211,154,.10)"
  },
  {
    id: "windows",
    label: "Windows",
    eyebrow: "Chrome / Edge",
    icon: Laptop,
    accent: "#b28cff",
    surface: "rgba(178,140,255,.10)"
  }
];

const detail: Record<
  PlatformId,
  {
    title: string;
    body: string;
    steps: string[];
  }
> = {
  web: {
    title: "Instalá Global Stock directamente desde la web.",
    body:
      "La versión PWA abre como una aplicación independiente y mantiene la misma interfaz de Global Stock.",
    steps: [
      "Tocá o hacé click en Instalar app.",
      "Confirmá la instalación del navegador.",
      "Abrila desde su propio icono."
    ]
  },
  iphone: {
    title: "Llevá Global Stock a la pantalla de inicio.",
    body:
      "En iPhone y iPad la instalación web se hace desde Safari, sin esperar una publicación nativa.",
    steps: [
      "Abrí Global Stock en Safari.",
      "Tocá Compartir.",
      "Elegí Añadir a pantalla de inicio."
    ]
  },
  android: {
    title: "Instalación rápida desde Chrome.",
    body:
      "Android puede instalar la PWA desde el propio navegador y abrirla como una app independiente.",
    steps: [
      "Abrí Global Stock en Chrome.",
      "Elegí Instalar app.",
      "Confirmá para agregarla al dispositivo."
    ]
  },
  windows: {
    title: "Global Stock como aplicación de escritorio.",
    body:
      "En Windows, Chrome y Edge pueden instalar la PWA para abrirla en su propia ventana.",
    steps: [
      "Abrí Global Stock en Chrome o Edge.",
      "Usá Instalar en la barra del navegador.",
      "Abrila desde Inicio o el escritorio."
    ]
  }
};

export function DownloadInstallShowcase({
  appStoreUrl,
  playStoreUrl,
  microsoftStoreUrl
}: Props) {
  const [active, setActive] = useState<PlatformId>("web");
  const current = platforms.find((item) => item.id === active)!;
  const currentDetail = detail[active];

  const nativeLink =
    active === "iphone"
      ? appStoreUrl
      : active === "android"
        ? playStoreUrl
        : active === "windows"
          ? microsoftStoreUrl
          : "";

  return (
    <div className="grid gap-5 lg:grid-cols-[.92fr_1.08fr]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {platforms.map(({ id, label, eyebrow, icon: Icon, accent, surface }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={
                "group flex min-h-[92px] items-center gap-4 rounded-[24px] border px-4 text-left transition duration-200 " +
                (selected
                  ? "border-white/18 bg-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,.24)]"
                  : "border-white/8 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.05]")
              }
            >
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                style={{ background: surface, color: accent }}
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[10px] font-bold uppercase tracking-[.14em]"
                  style={{ color: accent }}
                >
                  {eyebrow}
                </span>
                <span className="mt-1 block text-base font-semibold text-white">
                  {label}
                </span>
              </span>
              <span
                className={
                  "grid h-7 w-7 place-items-center rounded-full border text-xs transition " +
                  (selected
                    ? "border-white/20 bg-white text-black"
                    : "border-white/10 text-white/30 group-hover:text-white/60")
                }
              >
                {selected ? <Check size={13} /> : "›"}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(circle at 85% 10%, " +
            current.surface +
            ", transparent 34%), rgba(255,255,255,.035)"
        }}
      >
        <div
          className="absolute right-[-10%] top-[-18%] h-44 w-44 rounded-full blur-3xl"
          style={{ background: current.surface }}
        />

        <div className="relative">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em]"
            style={{
              color: current.accent,
              borderColor: current.accent + "38",
              background: current.surface
            }}
          >
            {current.eyebrow}
          </span>

          <h3 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-4xl">
            {currentDetail.title}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/56">
            {currentDetail.body}
          </p>

          <div className="mt-6 grid gap-2">
            {currentDetail.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3.5 py-3"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{
                    color: current.accent,
                    background: current.surface
                  }}
                >
                  {index + 1}
                </span>
                <p className="text-sm text-white/74">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <InstallAppButton language="es" />

            {active !== "web" && (
              nativeLink ? (
                <a
                  href={nativeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90"
                >
                  <Download size={15} />
                  Abrir tienda oficial
                </a>
              ) : (
                <span className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-semibold text-white/40">
                  Tienda nativa · Próximamente
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
