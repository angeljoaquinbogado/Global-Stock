"use client";

import { Check, Download } from "lucide-react";
import { useEffect, useState } from "react";

import { InstallAppButton } from "@/components/InstallAppButton";

type PlatformId = "web" | "iphone" | "android";

type Props = {
  appStoreUrl: string;
  playStoreUrl: string;
  microsoftStoreUrl: string;
};

const PLATFORM_EVENT = "global-stock-platform-change";

const platforms: Array<{
  id: PlatformId;
  label: string;
  eyebrow: string;
  logoSrc: string;
  logoClassName?: string;
}> = [
  {
    id: "web",
    label: "Navegador",
    eyebrow: "Disponible ahora",
    logoSrc: "/platforms/windows.svg"
  },
  {
    id: "iphone",
    label: "iOS",
    eyebrow: "Safari",
    logoSrc: "/platforms/apple.svg",
    logoClassName: "invert"
  },
  {
    id: "android",
    label: "Android",
    eyebrow: "Chrome",
    logoSrc: "/platforms/android.svg"
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
    title: "Instalalo desde el navegador y abrilo como una aplicación.",
    body:
      "La PWA queda disponible con su propio icono y se abre en una ventana independiente.",
    steps: [
      "Abrí Global Stock desde Chrome o Edge.",
      "Elegí Instalar app en el navegador.",
      "Abrilo desde Inicio o desde su propio acceso."
    ]
  },
  iphone: {
    title: "Agregá Global Stock a tu iPhone o iPad desde Safari.",
    body:
      "iOS permite guardar la aplicación web en la pantalla de inicio y usarla como acceso independiente.",
    steps: [
      "Abrí Global Stock en Safari.",
      "Tocá Compartir.",
      "Elegí Añadir a pantalla de inicio."
    ]
  },
  android: {
    title: "Instalá Global Stock en Android desde Chrome.",
    body:
      "La aplicación web puede quedar instalada en el dispositivo y abrirse desde su propio icono.",
    steps: [
      "Abrí Global Stock en Chrome.",
      "Elegí Instalar app.",
      "Confirmá para agregarla al dispositivo."
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
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-[#101012] p-1 ring-1 ring-[#28171b] " +
        (compact ? "mx-auto" : "")
      }
      role="tablist"
      aria-label="Plataforma"
    >
      {platforms.map(({ id, label, logoSrc, logoClassName }) => {
        const selected = active === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={
              "flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition " +
              (selected
                ? "bg-[#1b1b1e] text-white shadow-[0_8px_20px_rgba(0,0,0,.25)]"
                : "text-white/38 hover:bg-white/[0.04] hover:text-white/70")
            }
          >
            <img
              src={logoSrc}
              alt=""
              className={"h-[15px] w-[15px] object-contain " + (logoClassName ?? "")}
              aria-hidden="true"
            />
            <span>{label}</span>
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
    <div className="flex w-full justify-start">
      <PlatformTabs active={active} onChange={choose} compact />
    </div>
  );
}

export function DownloadInstallShowcase({
  appStoreUrl,
  playStoreUrl
}: Props) {
  const [active, setActive] = useState<PlatformId>("web");

  useEffect(() => {
    const onPlatformChange = (event: Event) => {
      const custom = event as CustomEvent<{ platform?: PlatformId }>;
      const platform = custom.detail?.platform;
      if (
        platform === "web" ||
        platform === "iphone" ||
        platform === "android"
      ) {
        setActive(platform);
      }
    };

    window.addEventListener(PLATFORM_EVENT, onPlatformChange);
    return () =>
      window.removeEventListener(PLATFORM_EVENT, onPlatformChange);
  }, []);

  const current = platforms.find((item) => item.id === active)!;
  const currentDetail = detail[active];

  const nativeLink =
    active === "iphone"
      ? appStoreUrl
      : active === "android"
        ? playStoreUrl
        : "";

  return (
    <div>
      <PlatformTabs active={active} onChange={setActive} />

      <div className="mt-5 overflow-hidden rounded-[30px] bg-[#111113] shadow-[0_30px_80px_rgba(0,0,0,.30)] ring-1 ring-[#2a171b]">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute right-[-10%] top-[-30%] h-64 w-64 rounded-full bg-[#c91527]/10 blur-[90px]" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04]">
                  <img
                    src={current.logoSrc}
                    alt=""
                    className={"h-5 w-5 object-contain " + (current.logoClassName ?? "")}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#ed4c5c]">
                    {current.eyebrow}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/34">
                    {current.label}
                  </p>
                </div>
              </div>

              <h3 className="mt-6 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-4xl">
                {currentDetail.title}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">
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
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90"
                    >
                      <Download size={15} />
                      Abrir tienda oficial
                    </a>
                  ) : (
                    <span className="inline-flex h-11 items-center rounded-xl bg-white/[0.04] px-4 text-xs font-semibold text-white/38">
                      Publicación nativa · Próximamente
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#211417] bg-[#0d0d0f] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/28">
              Instalación
            </p>

            <div className="mt-5">
              {currentDetail.steps.map((step, index) => (
                <div
                  key={step}
                  className={
                    "grid grid-cols-[34px_1fr] gap-3 py-4 " +
                    (index > 0 ? "border-t border-[#211417]" : "")
                  }
                >
                  <span className="text-[11px] font-bold text-[#ed4c5c]">
                    0{index + 1}
                  </span>
                  <p className="text-sm leading-6 text-white/60">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300/70">
              <Check size={14} />
              La versión web instalable está disponible ahora.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
