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
  accent: string;
}> = [
  {
    id: "web",
    label: "Navegador",
    eyebrow: "Disponible ahora",
    logoSrc: "/platforms/windows.png",
    accent: "#46b9ff"
  },
  {
    id: "iphone",
    label: "iOS",
    eyebrow: "Safari",
    logoSrc: "/platforms/apple.png",
    accent: "#ffffff"
  },
  {
    id: "android",
    label: "Android",
    eyebrow: "Chrome",
    logoSrc: "/platforms/android.png",
    accent: "#a4c639"
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
      "La PWA queda con su propio icono y puede abrirse en una ventana independiente del navegador.",
    steps: [
      "Abrí Global Stock desde Chrome o Edge.",
      "Elegí Instalar app en el navegador.",
      "Abrilo desde Inicio o desde su propio acceso."
    ]
  },
  iphone: {
    title: "Agregá Global Stock a tu iPhone o iPad desde Safari.",
    body:
      "iOS permite guardar la aplicación web en la pantalla de inicio y usarla como un acceso independiente.",
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
  onChange
}: {
  active: PlatformId;
  onChange: (platform: PlatformId) => void;
}) {
  return (
    <div
      className="gs-storefront-scroll inline-grid max-w-full grid-cols-3 gap-1 overflow-x-auto rounded-[16px] bg-white p-1.5 shadow-[0_14px_34px_rgba(0,0,0,.24)] ring-1 ring-black/10"
      role="tablist"
      aria-label="Plataforma"
    >
      {platforms.map(({ id, label, logoSrc }) => {
        const selected = active === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={
              "flex min-h-11 min-w-[104px] shrink-0 items-center justify-center gap-2 rounded-[11px] px-3 text-[12px] font-semibold text-[#111114] outline-none transition-[background-color,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] sm:min-w-[116px] " +
              (selected
                ? "bg-[#eef0f3] shadow-[0_4px_12px_rgba(0,0,0,.12)]"
                : "hover:bg-black/[0.035]")
            }
          >
            <img
              src={logoSrc}
              alt=""
              className={id === "android" ? "h-5 w-5 shrink-0 object-contain" : "h-[17px] w-[17px] shrink-0 object-contain"}
              aria-hidden="true"
              draggable={false}
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

  const choose = (platform: PlatformId) => {
    setActive(platform);

    window.dispatchEvent(
      new CustomEvent(PLATFORM_EVENT, {
        detail: { platform }
      })
    );

    document.getElementById("download-install")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start"
    });
  };

  return <PlatformTabs active={active} onChange={choose} />;
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

  const choose = (platform: PlatformId) => {
    setActive(platform);
    window.dispatchEvent(
      new CustomEvent(PLATFORM_EVENT, {
        detail: { platform }
      })
    );
  };

  const nativeStores = [
    {
      name: "App Store",
      platform: "iPhone y iPad",
      href: appStoreUrl,
      logoSrc: "/platforms/apple.png"
    },
    {
      name: "Google Play",
      platform: "Android",
      href: playStoreUrl,
      logoSrc: "/platforms/android.png"
    }
  ];

  return (
    <div>
      <div className="flex justify-center">
        <PlatformTabs active={active} onChange={choose} />
      </div>

      <div className="mt-6 overflow-hidden rounded-[32px] bg-[#111217] shadow-[0_30px_80px_rgba(0,0,0,.28)]">
        <div className="grid lg:grid-cols-[1.06fr_.94fr]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]">
                <img
                  src={current.logoSrc}
                  alt=""
                  className="h-5 w-5 object-contain"
                  aria-hidden="true"
                  draggable={false}
                />
              </span>
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[.14em]"
                  style={{ color: current.accent }}
                >
                  {current.eyebrow}
                </p>
                <p className="mt-1 text-xs font-medium text-white/40">
                  {current.label}
                </p>
              </div>
            </div>

            <h3 className="mt-6 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-4xl">
              {currentDetail.title}
            </h3>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[#a0a0a9]">
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
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-white/90"
                  >
                    <Download size={15} />
                    Abrir tienda oficial
                  </a>
                ) : (
                  <span className="inline-flex h-11 items-center rounded-xl bg-white/[0.04] px-4 text-xs font-semibold text-white/42">
                    Publicación nativa · Próximamente
                  </span>
                ))}
            </div>
          </div>

          <div className="bg-[#0d0e12] p-6 sm:p-8 lg:border-l lg:border-white/[0.045]">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/28">
              Instalación
            </p>

            <div className="mt-5">
              {currentDetail.steps.map((step, index) => (
                <div
                  key={step}
                  className={
                    "grid grid-cols-[34px_1fr] gap-3 py-4 " +
                    (index > 0 ? "border-t border-white/[0.045]" : "")
                  }
                >
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: current.accent }}
                  >
                    0{index + 1}
                  </span>
                  <p className="text-sm leading-6 text-white/60">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300/76">
              <Check size={14} />
              La versión web instalable está disponible ahora.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {nativeStores.map((store) =>
          store.href ? (
            <a
              key={store.name}
              href={store.href}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#111216] px-4 transition-colors duration-150 hover:bg-[#16171c]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04]">
                <img
                  src={store.logoSrc}
                  alt=""
                  className="h-5 w-5 object-contain"
                  aria-hidden="true"
                  draggable={false}
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{store.name}</p>
                <p className="mt-1 text-xs text-white/40">{store.platform}</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-emerald-300">
                Disponible
              </span>
            </a>
          ) : (
            <div
              key={store.name}
              className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#111216] px-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04]">
                <img
                  src={store.logoSrc}
                  alt=""
                  className="h-5 w-5 object-contain"
                  aria-hidden="true"
                  draggable={false}
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{store.name}</p>
                <p className="mt-1 text-xs text-white/40">{store.platform}</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-white/32">
                Próximamente
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
