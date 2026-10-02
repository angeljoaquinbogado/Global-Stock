"use client";

import createGlobe from "cobe";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

type GlobeMarker = {
  id: string;
  label: string;
  location: [number, number];
  size: number;
  primary?: boolean;
};

type GlobeArc = {
  id: string;
  label: string;
  from: [number, number];
  to: [number, number];
  showLabel?: boolean;
};

type CobeGlobeHandle = {
  update: (state: Record<string, unknown>) => void;
  destroy: () => void;
};

const markers: GlobeMarker[] = [
  {
    id: "gs-buenos-aires",
    label: "BUENOS AIRES",
    location: [-34.6037, -58.3816],
    size: 0.034,
    primary: true
  },
  {
    id: "gs-sao-paulo",
    label: "SÃO PAULO",
    location: [-23.5505, -46.6333],
    size: 0.03,
    primary: true
  },
  {
    id: "gs-mexico",
    label: "MÉXICO",
    location: [19.4326, -99.1332],
    size: 0.021
  },
  {
    id: "gs-new-york",
    label: "NEW YORK",
    location: [40.7128, -74.006],
    size: 0.024
  },
  {
    id: "gs-london",
    label: "LONDON",
    location: [51.5074, -0.1278],
    size: 0.022
  },
  {
    id: "gs-madrid",
    label: "MADRID",
    location: [40.4168, -3.7038],
    size: 0.021
  },
  {
    id: "gs-berlin",
    label: "BERLIN",
    location: [52.52, 13.405],
    size: 0.02
  },
  {
    id: "gs-tokyo",
    label: "TOKYO",
    location: [35.6762, 139.6503],
    size: 0.023
  },
  {
    id: "gs-sydney",
    label: "SYDNEY",
    location: [-33.8688, 151.2093],
    size: 0.022
  }
];

const arcs: GlobeArc[] = [
  {
    id: "gs-ba-brazil",
    label: "ARGENTINA → BRASIL",
    from: [-34.6037, -58.3816],
    to: [-23.5505, -46.6333],
    showLabel: true
  },
  {
    id: "gs-ba-mexico",
    label: "ARGENTINA → MÉXICO",
    from: [-34.6037, -58.3816],
    to: [19.4326, -99.1332],
    showLabel: true
  },
  {
    id: "gs-ba-new-york",
    label: "ARGENTINA → USA",
    from: [-34.6037, -58.3816],
    to: [40.7128, -74.006],
    showLabel: true
  },
  {
    id: "gs-ba-madrid",
    label: "ARGENTINA → ESPAÑA",
    from: [-34.6037, -58.3816],
    to: [40.4168, -3.7038],
    showLabel: true
  },
  {
    id: "gs-ba-london",
    label: "ARGENTINA → UK",
    from: [-34.6037, -58.3816],
    to: [51.5074, -0.1278],
    showLabel: true
  },
  {
    id: "gs-ba-berlin",
    label: "ARGENTINA → ALEMANIA",
    from: [-34.6037, -58.3816],
    to: [52.52, 13.405],
    showLabel: true
  },
  {
    id: "gs-ba-tokyo",
    label: "ARGENTINA → JAPÓN",
    from: [-34.6037, -58.3816],
    to: [35.6762, 139.6503],
    showLabel: true
  },
  {
    id: "gs-ba-sydney",
    label: "ARGENTINA → AUSTRALIA",
    from: [-34.6037, -58.3816],
    to: [-33.8688, 151.2093],
    showLabel: true
  }
]

function anchorLabelStyle(
  id: string,
  kind: "marker" | "arc"
): CSSProperties {
  const visible =
    kind === "marker"
      ? `--cobe-visible-${id}`
      : `--cobe-visible-arc-${id}`;
  const anchor = kind === "marker" ? `--cobe-${id}` : `--cobe-arc-${id}`;

  return {
    position: "absolute",
    bottom: "anchor(top)",
    left: "anchor(center)",
    opacity: `var(${visible}, 0)`,
    positionAnchor: anchor,
    transform: "translate3d(-50%, -7px, 0)",
    transition: "opacity 160ms cubic-bezier(0.23, 1, 0.32, 1)"
  } as CSSProperties;
}

export function GlobalStockGlobe() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<CobeGlobeHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef(680);
  const phiRef = useRef(-1.08);
  const thetaRef = useRef(0.08);
  const dragRef = useRef({ phi: 0, theta: 0 });
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef({ phi: 0, theta: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const lastFrameRef = useRef(0);

  const cobeMarkers = useMemo(
    () =>
      markers.map((marker) => ({
        id: marker.id,
        location: marker.location,
        size: marker.size
      })),
    []
  );

  const cobeArcs = useMemo(
    () =>
      arcs.map((arc) => ({
        id: arc.id,
        from: arc.from,
        to: arc.to
      })),
    []
  );

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!pointerRef.current) return;

    const deltaX = event.clientX - pointerRef.current.x;
    const deltaY = event.clientY - pointerRef.current.y;
    dragRef.current = {
      phi: deltaX / 360,
      theta: Math.max(-0.24, Math.min(0.24, deltaY / 920))
    };

    const now = performance.now();
    const previous = lastPointerRef.current;

    if (previous) {
      const elapsed = Math.max(now - previous.t, 1);
      velocityRef.current = {
        phi: Math.max(
          -0.08,
          Math.min(0.08, ((event.clientX - previous.x) / elapsed) * 0.12)
        ),
        theta: Math.max(
          -0.035,
          Math.min(0.035, ((event.clientY - previous.y) / elapsed) * 0.045)
        )
      };
    }

    lastPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: now
    };
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerRef.current) {
      phiRef.current += dragRef.current.phi;
      thetaRef.current = Math.max(
        -0.3,
        Math.min(0.3, thetaRef.current + dragRef.current.theta)
      );
    }

    pointerRef.current = null;
    dragRef.current = { phi: 0, theta: 0 };
    lastPointerRef.current = null;

    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      lastPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: performance.now()
      };
      velocityRef.current = { phi: 0, theta: 0 };

      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, {
      passive: true
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      coarsePointer ? 1.25 : 1.5
    );
    const samples = coarsePointer ? 6200 : 9800;

    const readSize = () => {
      const rect = root.getBoundingClientRect();
      const cssSize = Math.max(320, Math.round(Math.min(rect.width, rect.height)));
      sizeRef.current = Math.max(480, Math.round(cssSize * dpr));
      canvas.width = sizeRef.current;
      canvas.height = sizeRef.current;
    };

    readSize();

    const globe = createGlobe(
      canvas,
      {
        devicePixelRatio: dpr,
        width: sizeRef.current,
        height: sizeRef.current,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.35,
        mapSamples: samples,
        mapBrightness: 7.2,
        baseColor: [0.045, 0.047, 0.052],
        markerColor: [0.93, 0.08, 0.08],
        glowColor: [0.3, 0.018, 0.025],
        opacity: 0.94,
        scale: 0.98,
        offset: [0, 0],
        markers: cobeMarkers,
        arcs: cobeArcs,
        arcColor: [0.82, 0.025, 0.035],
        arcWidth: 0.56,
        arcHeight: 0.38,
        markerElevation: 0.026
      } as never
    ) as unknown as CobeGlobeHandle;

    globeRef.current = globe;

    const observer = new ResizeObserver(() => {
      readSize();
      globe.update({
        width: sizeRef.current,
        height: sizeRef.current
      });
    });
    observer.observe(root);

    const tick = (timestamp: number) => {
      if (!globeRef.current) return;

      if (
        document.visibilityState === "visible" &&
        timestamp - lastFrameRef.current >= 16
      ) {
        lastFrameRef.current = timestamp;

        if (!pointerRef.current) {
          if (!reducedMotion) {
            phiRef.current += coarsePointer ? 0.00115 : 0.00145;
          }

          if (Math.abs(velocityRef.current.phi) > 0.00008) {
            phiRef.current += velocityRef.current.phi;
            velocityRef.current.phi *= 0.94;
          }

          if (Math.abs(velocityRef.current.theta) > 0.00008) {
            thetaRef.current = Math.max(
              -0.3,
              Math.min(0.3, thetaRef.current + velocityRef.current.theta)
            );
            velocityRef.current.theta *= 0.92;
          }
        }

        globeRef.current.update({
          phi: phiRef.current + dragRef.current.phi,
          theta: Math.max(
            -0.3,
            Math.min(0.3, thetaRef.current + dragRef.current.theta)
          ),
          width: sizeRef.current,
          height: sizeRef.current,
          markers: cobeMarkers,
          arcs: cobeArcs
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopAnimation();
      observer.disconnect();
      globe.destroy();
      globeRef.current = null;
    };
  }, [cobeArcs, cobeMarkers, stopAnimation]);

  return (
    <div
      ref={rootRef}
      className="gs-cobe-globe-shell relative h-full w-full"
      data-global-stock-globe
    >
      <canvas
        ref={canvasRef}
        className="gs-cobe-globe-canvas relative z-[2] h-full w-full cursor-grab touch-none select-none"
        onPointerDown={handlePointerDown}
        aria-label="Red global de Global Stock"
      />

      <div className="pointer-events-none absolute inset-0 z-[3]">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={
              "gs-cobe-marker " +
              (marker.primary ? "gs-cobe-marker-primary" : "")
            }
            style={anchorLabelStyle(marker.id, "marker")}
          >
            <span className="gs-cobe-marker-dot" aria-hidden="true" />
            {marker.label}
          </div>
        ))}

        {arcs
          .filter((arc) => arc.showLabel)
          .map((arc) => (
            <div
              key={arc.id}
              className="gs-cobe-route-label"
              style={anchorLabelStyle(arc.id, "arc")}
            >
              {arc.label}
            </div>
          ))}
      </div>
    </div>
  );
}
