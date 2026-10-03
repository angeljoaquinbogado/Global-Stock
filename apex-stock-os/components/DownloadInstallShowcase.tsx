"use client";

import {
  Check,
  Download,
  Laptop
} from "lucide-react";
import { useEffect, useState } from "react";

import { InstallAppButton } from "@/components/InstallAppButton";

type PlatformId = "web" | "iphone" | "android" | "windows";

type Props = {
  appStoreUrl: string;
  playStoreUrl: string;
  microsoftStoreUrl: string;
};

const PLATFORM_EVENT = "global-stock-platform-change";

const platforms: Array<{
  id: PlatformId;
  label: string;
  shortLabel: string;
  eyebrow: string;
  icon?: typeof Laptop;
  logoSrc?: string;
  accent: string;
  surface: string;
}> = [
  {
    id: "web",
    label: "Navegador",
    shortLabel: "Navegador",
    eyebrow: "Disponible ahora",
    logoSrc: "/platforms/windows.svg",
    accent: "#00adef",
    surface: "rgba(59,130,246,.10)"
  },
  {
    id: "iphone",
    label: "iOS",
    shortLabel: "iOS",
    eyebrow: "Safari",
    logoSrc: "/platforms/apple.svg",
    accent: "#111827",
    surface: "rgba(17,24,39,.08)"
  },
  {
    id: "android",
    label: "Android",
    shortLabel: "Android",
    eyebrow: "Chrome",
    logoSrc: "/platforms/android.svg",
    accent: "#a4c639",
    surface: "rgba(34,197,94,.10)"
  },
  {
    id: "windows",
    label: "Windows",
    shortLabel: "Windows",
    eyebrow: "Chrome / Edge",
    icon: Laptop,
    accent: "#8b5cf6",
    surface: "rgba(139,92,246,.10)"
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
    title: "Instalá Global Stock directamente desde el navegador.",
    body:
      "La PWA abre como una aplicación independiente, con su propio icono y sin depender de una tienda nativa.",
    steps: [
      "Hacé click en Instalar app.",
      "Confirmá la instalación del navegador.",
      "Abrila desde su propio icono."
    ]
  },
  iphone: {
    title: "Llevá Global Stock a tu iPhone o iPad.",
    body:
      "En iOS la instalación web se hace desde Safari y queda disponible desde la pantalla de inicio.",
    steps: [
      "Abrí Global Stock en Safari.",
      "Tocá Compartir.",
      "Elegí Añadir a pantalla de inicio."
    ]
  },
  android: {
    title: "Instalá Global Stock en Android desde Chrome.",
    body:
      "Android permite instalar la PWA y abrirla como una app independiente desde el dispositivo.",
    steps: [
      "Abrí Global Stock en Chrome.",
      "Elegí Instalar app.",
      "Confirmá para agregarla al dispositivo."
    ]
  },
  windows: {
    title: "Usá Global Stock como aplicación de escritorio.",
    body:
      "Chrome y Edge pueden instalar la PWA en Windows para abrirla en una ventana propia.",
    steps: [
      "Abrí Global Stock en Chrome o Edge.",
      "Usá Instalar en la barra del navegador.",
      "Abrila desde Inicio o el escritorio."
    ]
  }
};

function PlatformTabs({
  active,
  onChange,
  compact = false
}: {
  active: PlatformId;
  onChange: (platform: PlatformId) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-black/8 bg-[#f8f9fb] p-1 shadow-[0_12px_32px_rgba(15,23,42,.10)] " +
        (compact ? "mx-auto" : "")
      }
      role="tablist"
      aria-label="Plataforma"
    >
      {platforms.map(({ id, shortLabel, icon: Icon, logoSrc, accent }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={
              "flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition duration-200 " +
              (selected
                ? "bg-white text-[#172033] shadow-[0_4px_14px_rgba(15,23,42,.10)]"
                : "text-[#5e6675] hover:bg-white/70 hover:text-[#172033]")
            }
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="h-[15px] w-[15px] object-contain"
                aria-hidden="true"
              />
            ) : Icon ? (
              <Icon
                size={15}
                strokeWidth={selected ? 2.2 : 1.9}
                style={{ color: accent }}
              />
            ) : null}
            <span>{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DownloadPlatformQuickTabs() {
  const [active, setActive] = useState<PlatformId>("web");

  const choose = (platform: PlatformId) => {
    setActive(platform);
    window.dispatchEvent(
      new CustomEvent(PLATFORM_EVENT, {
        detail: { platform }
      })
    );

    document.getElementById("download-install")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <div className="flex w-full justify-center">
      <PlatformTabs active={active} onChange={choose} compact />
    </div>
  );
}

export function DownloadInstallShowcase({
  appStoreUrl,
  playStoreUrl,
  microsoftStoreUrl
}: Props) {
  const [active, setActive] = useState<PlatformId>("web");

  useEffect(() => {
    const onPlatformChange = (event: Event) => {
      const custom = event as CustomEvent<{ platform?: PlatformId }>;
      const platform = custom.detail?.platform;
      if (
        platform === "web" ||
        platform === "iphone" ||
        platform === "android" ||
        platform === "windows"
      ) {
        setActive(platform);
      }
    };

    window.addEventListener(PLATFORM_EVENT, onPlatformChange);
    return () =>
      window.removeEventListener(PLATFORM_EVENT, onPlatformChange);
  }, []);

  const current = platforms.find((item) => item.id === active)!;
  const CurrentIcon = current.icon;
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
    <div>
      <div className="flex justify-center">
        <PlatformTabs active={active} onChange={setActive} />
      </div>

      <div
        className="relative mt-6 overflow-hidden rounded-[30px] border border-white/10 p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(circle at 86% 8%, " +
            current.surface +
            ", transparent 34%), rgba(255,255,255,.035)"
        }}
      >
        <div
          className="absolute right-[-8%] top-[-22%] h-56 w-56 rounded-full blur-3xl"
          style={{ background: current.surface }}
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_.92fr] lg:items-start">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em]"
              style={{
                color:
                  active === "iphone" ? "rgba(255,255,255,.72)" : current.accent,
                borderColor:
                  active === "iphone"
                    ? "rgba(255,255,255,.14)"
                    : current.accent + "38",
                background:
                  active === "iphone"
                    ? "rgba(255,255,255,.05)"
                    : current.surface
              }}
            >
              {current.logoSrc ? (
                <img
                  src={current.logoSrc}
                  alt=""
                  className="h-[13px] w-[13px] object-contain"
                  aria-hidden="true"
                />
              ) : CurrentIcon ? (
                <CurrentIcon size={13} />
              ) : null}
              {current.eyebrow}
            </span>

            <h3 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-4xl">
              {currentDetail.title}
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/58">
              {currentDetail.body}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <InstallAppButton language="es" />

              {active !== "web" &&
                (nativeLink ? (
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
                  <span className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-semibold text-white/42">
                    Publicación nativa · Próximamente
                  </span>
                ))}
            </div>
          </div>

          <div className="grid gap-2.5">
            {currentDetail.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3.5 py-3.5"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{
                    color:
                      active === "iphone"
                        ? "rgba(255,255,255,.82)"
                        : current.accent,
                    background:
                      active === "iphone"
                        ? "rgba(255,255,255,.07)"
                        : current.surface
                  }}
                >
                  {index + 1}
                </span>
                <p className="text-sm leading-5 text-white/74">{step}</p>
              </div>
            ))}

            <div className="mt-1 flex items-center gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.055] px-3.5 py-3 text-xs text-emerald-300/78">
              <Check size={14} />
              La versión web instalable está disponible ahora.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
