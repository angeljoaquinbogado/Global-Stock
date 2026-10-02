"use client";

type Point = {
  id: string;
  label: string;
  x: number;
  y: number;
  primary?: boolean;
};

type Route = {
  id: string;
  from: string;
  to: string;
  curveX: number;
  curveY: number;
  particle?: boolean;
  delay: number;
  duration: number;
};

const points: Point[] = [
  { id: "arg", label: "AR", x: 500, y: 746, primary: true },
  { id: "bra", label: "BR", x: 568, y: 622, primary: true },
  { id: "usa", label: "US", x: 390, y: 322 },
  { id: "mex", label: "MX", x: 414, y: 438 },
  { id: "esp", label: "ES", x: 694, y: 390 },
  { id: "uk", label: "UK", x: 690, y: 315 },
  { id: "ger", label: "DE", x: 744, y: 334 },
  { id: "jpn", label: "JP", x: 881, y: 438 },
  { id: "aus", label: "AU", x: 856, y: 724 }
];

const routes: Route[] = [
  {
    id: "arg-bra",
    from: "arg",
    to: "bra",
    curveX: 545,
    curveY: 668,
    particle: true,
    delay: 0.1,
    duration: 4.2
  },
  {
    id: "arg-usa",
    from: "arg",
    to: "usa",
    curveX: 330,
    curveY: 500,
    particle: true,
    delay: 0.6,
    duration: 5.8
  },
  {
    id: "arg-mex",
    from: "arg",
    to: "mex",
    curveX: 365,
    curveY: 560,
    delay: 1.1,
    duration: 5.2
  },
  {
    id: "usa-uk",
    from: "usa",
    to: "uk",
    curveX: 535,
    curveY: 205,
    particle: true,
    delay: 0.8,
    duration: 5.4
  },
  {
    id: "uk-ger",
    from: "uk",
    to: "ger",
    curveX: 719,
    curveY: 300,
    delay: 1.6,
    duration: 3.6
  },
  {
    id: "esp-uk",
    from: "esp",
    to: "uk",
    curveX: 666,
    curveY: 346,
    delay: 2,
    duration: 3.4
  },
  {
    id: "ger-jpn",
    from: "ger",
    to: "jpn",
    curveX: 842,
    curveY: 302,
    particle: true,
    delay: 1.5,
    duration: 5.6
  },
  {
    id: "jpn-aus",
    from: "jpn",
    to: "aus",
    curveX: 920,
    curveY: 588,
    particle: true,
    delay: 2.4,
    duration: 5
  },
  {
    id: "bra-esp",
    from: "bra",
    to: "esp",
    curveX: 650,
    curveY: 458,
    particle: true,
    delay: 1.2,
    duration: 5
  }
];

const pointMap = new Map(points.map((point) => [point.id, point]));

function routePath(route: Route) {
  const from = pointMap.get(route.from);
  const to = pointMap.get(route.to);

  if (!from || !to) return "";

  return `M ${from.x} ${from.y} Q ${route.curveX} ${route.curveY} ${to.x} ${to.y}`;
}

export function GlobalConnectionOverlay() {
  return (
    <div className="gs-global-network pointer-events-none absolute inset-[4.6%] z-[3] overflow-hidden rounded-full">
      <svg
        viewBox="0 0 1000 1000"
        className="h-full w-full overflow-visible"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gs-route-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5E0000" stopOpacity="0.3" />
            <stop offset="48%" stopColor="#B20A0A" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#FF5C5C" stopOpacity="0.38" />
          </linearGradient>

          <radialGradient id="gs-pin-core" cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#FF7D7D" />
            <stop offset="35%" stopColor="#D31212" />
            <stop offset="100%" stopColor="#720000" />
          </radialGradient>

          <filter id="gs-route-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="gs-pin-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="gs-global-route-layer" filter="url(#gs-route-glow)">
          {routes.map((route) => {
            const d = routePath(route);

            return (
              <g key={route.id}>
                <path
                  d={d}
                  pathLength={1}
                  className="gs-global-route gs-global-route-shadow"
                  style={{
                    animationDelay: `${route.delay}s`,
                    animationDuration: `${route.duration}s`
                  }}
                />
                <path
                  d={d}
                  pathLength={1}
                  className="gs-global-route gs-global-route-main"
                  style={{
                    animationDelay: `${route.delay}s`,
                    animationDuration: `${route.duration}s`
                  }}
                />

                {route.particle && (
                  <circle
                    r="4.5"
                    className="gs-route-particle"
                    filter="url(#gs-route-glow)"
                  >
                    <animateMotion
                      dur={`${route.duration}s`}
                      begin={`${route.delay}s`}
                      repeatCount="indefinite"
                      path={d}
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="spline"
                      keySplines=".42 0 .2 1"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        <g className="gs-global-pin-layer">
          {points.map((point, index) => (
            <g
              key={point.id}
              transform={`translate(${point.x} ${point.y})`}
              className={
                "gs-global-pin " +
                (point.primary ? "gs-global-pin-primary" : "")
              }
              style={{
                animationDelay: `${0.18 + index * 0.1}s`
              }}
            >
              <circle
                r={point.primary ? 27 : 22}
                className="gs-global-pin-halo"
              />

              <g filter="url(#gs-pin-glow)">
                <path
                  d="M 0 -20 C -12 -20 -21 -11 -21 1 C -21 16 0 33 0 33 C 0 33 21 16 21 1 C 21 -11 12 -20 0 -20 Z"
                  fill="url(#gs-pin-core)"
                  stroke="rgba(255,255,255,.75)"
                  strokeWidth="2"
                />
                <circle r="7.2" fill="rgba(255,255,255,.96)" />
                <circle r="3.2" fill="#8F0000" />
              </g>

              <g
                transform="translate(0 45)"
                className="gs-global-pin-label"
              >
                <rect
                  x="-18"
                  y="-10"
                  width="36"
                  height="20"
                  rx="10"
                  fill="rgba(0,0,0,.58)"
                  stroke="rgba(255,255,255,.14)"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  letterSpacing="1.4"
                  fill="rgba(255,255,255,.88)"
                >
                  {point.label}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
