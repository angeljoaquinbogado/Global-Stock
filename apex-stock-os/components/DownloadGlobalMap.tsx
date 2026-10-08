"use client";

import {
  Boxes,
  Building2,
  MapPin,
  PackageSearch,
  Store,
  Warehouse
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

type MapLocation = {
  id: string;
  country: string;
  city: string;
  kind: string;
  x: number;
  y: number;
  primary?: boolean;
  icon: typeof Building2;
};

const locations: MapLocation[] = [
  {
    id: "argentina",
    country: "Argentina",
    city: "Buenos Aires",
    kind: "Casa central",
    x: 405,
    y: 415,
    primary: true,
    icon: Building2
  },
  {
    id: "brasil",
    country: "Brasil",
    city: "São Paulo",
    kind: "Sucursal",
    x: 445,
    y: 379,
    icon: Store
  },
  {
    id: "mexico",
    country: "México",
    city: "Ciudad de México",
    kind: "Sucursal",
    x: 270,
    y: 235,
    icon: Store
  },
  {
    id: "usa",
    country: "Estados Unidos",
    city: "Nueva York",
    kind: "Operación online",
    x: 353,
    y: 164,
    icon: PackageSearch
  },
  {
    id: "espana",
    country: "España",
    city: "Madrid",
    kind: "Sucursal",
    x: 588,
    y: 165,
    icon: Store
  },
  {
    id: "uk",
    country: "Reino Unido",
    city: "Londres",
    kind: "Depósito",
    x: 600,
    y: 128,
    icon: Warehouse
  },
  {
    id: "alemania",
    country: "Alemania",
    city: "Berlín",
    kind: "Depósito",
    x: 645,
    y: 125,
    icon: Warehouse
  },
  {
    id: "japon",
    country: "Japón",
    city: "Tokio",
    kind: "Operación online",
    x: 1066,
    y: 181,
    icon: Boxes
  },
  {
    id: "australia",
    country: "Australia",
    city: "Sídney",
    kind: "Sucursal",
    x: 1104,
    y: 413,
    icon: Store
  }
];

const origin = locations[0];

function routePath(destination: MapLocation) {
  const midX = (origin.x + destination.x) / 2;
  const distance = Math.abs(destination.x - origin.x);
  const lift = Math.min(160, 54 + distance * 0.14);
  const controlY = Math.min(origin.y, destination.y) - lift;

  return `M ${origin.x} ${origin.y} Q ${midX} ${controlY} ${destination.x} ${destination.y}`;
}

export function DownloadGlobalMap() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState("usa");
  const active = useMemo(
    () => locations.find((item) => item.id === activeId) ?? locations[1],
    [activeId]
  );
  const ActiveIcon = active.icon;

  return (
    <section
      id="download-network"
      data-download-section
      className="gs-global-map-section relative scroll-mt-20 overflow-hidden border-t border-white/[0.045]"
    >
      <div className="mx-auto w-full max-w-[1320px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-9 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
          <div>
            <p className="gs-download-kicker text-[10px] font-bold uppercase tracking-[.17em] text-[#8F0000]">
              Operación global
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Todo tu negocio,
              <span className="block text-white/34">en un mismo mapa.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#a8a8b0] sm:text-base sm:leading-7 lg:justify-self-end">
            Visualizá sucursales, depósitos y operaciones conectadas desde un único lugar.
            Las ubicaciones de esta vista son de ejemplo para mostrar cómo se puede representar
            una red internacional dentro de Global Stock.
          </p>
        </div>

        <div className="gs-global-map-shell relative mt-11 overflow-hidden rounded-[34px] border border-white/[0.06] bg-[#0d0e12] shadow-[0_28px_90px_rgba(0,0,0,.20)]">
          <div className="absolute left-5 top-5 z-20 rounded-full border border-white/[0.07] bg-black/25 px-3 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/42 backdrop-blur-md sm:left-6 sm:top-6">
            Vista interactiva · ejemplo
          </div>

          <div className="relative aspect-[2/1] min-h-[360px] w-full sm:min-h-[440px]">
            <svg
              viewBox="0 0 1200 600"
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label="Mapa mundial con ubicaciones conectadas desde Argentina"
            >
              <defs>
                <pattern id="gs-map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity=".05"
                  />
                </pattern>
                <linearGradient id="gs-map-land" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity=".36" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity=".17" />
                </linearGradient>
                <radialGradient id="gs-map-origin-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8F0000" stopOpacity=".34" />
                  <stop offset="100%" stopColor="#8F0000" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="1200" height="600" fill="url(#gs-map-grid)" className="text-white" />

              <g className="gs-global-map-land text-[#c9cdd4]">
                <path d="M72 130 C92 101 127 88 160 79 C202 67 246 76 278 95 C306 111 321 132 319 151 C316 171 293 180 280 194 C266 209 265 229 245 239 C222 251 191 245 176 229 C163 216 160 194 143 185 C124 175 96 179 82 160 C74 150 69 140 72 130 Z" fill="url(#gs-map-land)" />
                <path d="M250 196 C272 197 288 208 300 223 C311 238 322 248 338 255 C350 261 358 274 351 286 C342 301 317 301 301 292 C288 284 276 271 266 255 C254 236 243 214 250 196 Z" fill="url(#gs-map-land)" />
                <path d="M335 304 C357 296 381 305 397 321 C416 340 421 363 414 390 C407 419 397 448 385 479 C374 507 361 540 346 552 C337 559 326 553 326 541 C326 522 337 498 336 477 C335 451 320 431 316 404 C312 377 317 333 335 304 Z" fill="url(#gs-map-land)" />
                <path d="M259 54 C281 40 309 37 329 48 C348 59 350 79 337 93 C322 109 294 114 273 104 C253 95 243 71 259 54 Z" fill="url(#gs-map-land)" />

                <path d="M550 124 C569 112 594 111 612 121 C628 130 636 145 632 159 C626 176 604 184 583 181 C561 178 543 166 540 150 C538 140 542 130 550 124 Z" fill="url(#gs-map-land)" />
                <path d="M565 184 C594 173 630 178 649 198 C667 216 671 247 660 275 C649 302 631 329 620 359 C610 385 595 420 574 431 C557 440 540 425 541 404 C543 378 557 354 554 328 C551 299 529 278 528 247 C527 219 542 194 565 184 Z" fill="url(#gs-map-land)" />

                <path d="M625 106 C654 91 688 89 714 100 C735 109 749 126 773 130 C799 134 823 123 846 127 C872 132 890 151 916 155 C948 160 980 149 1006 164 C1027 177 1030 198 1015 212 C999 227 973 229 950 224 C928 220 908 208 887 211 C860 214 839 235 811 239 C786 242 760 233 741 219 C720 204 708 184 688 174 C669 165 643 166 629 151 C617 139 612 118 625 106 Z" fill="url(#gs-map-land)" />
                <path d="M770 246 C794 240 823 248 840 263 C855 277 859 296 849 309 C836 325 810 326 789 318 C767 309 751 291 753 273 C754 260 760 251 770 246 Z" fill="url(#gs-map-land)" />
                <path d="M897 245 C919 236 943 242 959 257 C973 271 979 289 970 301 C959 316 933 317 913 309 C893 300 881 283 883 266 C884 257 889 250 897 245 Z" fill="url(#gs-map-land)" />
                <path d="M1042 361 C1064 347 1093 345 1118 356 C1143 367 1162 390 1158 412 C1153 436 1125 451 1097 450 C1071 449 1044 435 1034 414 C1025 396 1027 371 1042 361 Z" fill="url(#gs-map-land)" />
                <path d="M1006 181 C1015 173 1027 173 1034 181 C1041 189 1038 201 1029 207 C1020 213 1008 209 1003 200 C999 193 1001 186 1006 181 Z" fill="url(#gs-map-land)" />
              </g>

              <g opacity=".68">
                {locations.slice(1).map((destination) => (
                  <path
                    key={destination.id}
                    d={routePath(destination)}
                    fill="none"
                    stroke="#8F0000"
                    strokeWidth="1.15"
                    vectorEffect="non-scaling-stroke"
                    opacity={destination.id === activeId ? .72 : .20}
                  />
                ))}
              </g>

              <AnimatePresence mode="wait">
                {active.id !== "argentina" ? (
                  <motion.path
                    key={active.id}
                    d={routePath(active)}
                    fill="none"
                    stroke="#d11226"
                    strokeWidth="2.2"
                    vectorEffect="non-scaling-stroke"
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? .01 : .62, ease: [0.23, 1, 0.32, 1] }}
                  />
                ) : null}
              </AnimatePresence>

              <circle cx={origin.x} cy={origin.y} r="58" fill="url(#gs-map-origin-glow)" />
            </svg>

            {locations.map((location) => {
              const selected = location.id === activeId;
              const x = (location.x / 1200) * 100;
              const y = (location.y / 600) * 100;

              return (
                <button
                  key={location.id}
                  type="button"
                  onMouseEnter={() => setActiveId(location.id)}
                  onFocus={() => setActiveId(location.id)}
                  onClick={() => setActiveId(location.id)}
                  className="gs-global-map-pin group absolute z-10 grid -translate-x-1/2 -translate-y-full place-items-center"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-label={`${location.country}, ${location.city}`}
                  aria-current={selected ? "true" : undefined}
                >
                  {selected ? (
                    <motion.span
                      layoutId="gs-global-map-pin-ring"
                      className="absolute bottom-[-4px] h-9 w-9 rounded-full border border-[#8F0000]/30 bg-[#8F0000]/10"
                      transition={{ type: "spring", duration: .5, bounce: .18 }}
                    />
                  ) : null}
                  <span
                    className={
                      "relative grid h-8 w-8 place-items-center rounded-full border shadow-[0_8px_24px_rgba(0,0,0,.20)] backdrop-blur-md transition-[transform,background-color,border-color] duration-150 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-0.5 " +
                      (location.primary
                        ? "border-[#8F0000]/45 bg-[#8F0000] text-white"
                        : selected
                          ? "border-[#8F0000]/40 bg-[#16171c] text-[#ff6672]"
                          : "border-white/[0.09] bg-black/55 text-white/62")
                    }
                  >
                    <MapPin size={15} strokeWidth={2.2} />
                  </span>
                </button>
              );
            })}

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="absolute bottom-5 left-5 z-20 w-[min(330px,calc(100%-40px))] rounded-[22px] border border-white/[0.07] bg-black/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-xl sm:bottom-6 sm:left-6"
                initial={reduceMotion ? false : { opacity: 0, transform: "translate3d(0,8px,0) scale(.98)" }}
                animate={{ opacity: 1, transform: "translate3d(0,0,0) scale(1)" }}
                exit={{ opacity: 0, transform: "translate3d(0,-4px,0) scale(.99)" }}
                transition={{ duration: .22, ease: [0.23, 1, 0.32, 1] }}
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#8F0000]/14 text-[#ff6672]">
                    <ActiveIcon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[.15em] text-white/34">
                      {active.kind}
                    </p>
                    <h3 className="mt-1 text-base font-semibold tracking-[-.025em] text-white">
                      {active.country}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/46">{active.city}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-white/[0.055] px-4 py-4 sm:flex-wrap sm:overflow-visible sm:px-5">
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => setActiveId(location.id)}
                className={
                  "shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold transition-[background-color,border-color,color,transform] duration-150 [transition-timing-function:var(--ease-out)] active:scale-[.98] " +
                  (activeId === location.id
                    ? "border-[#8F0000]/35 bg-[#8F0000]/12 text-[#ff6672]"
                    : "border-white/[0.06] bg-white/[0.025] text-white/44 hover:text-white/72")
                }
              >
                {location.country}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
