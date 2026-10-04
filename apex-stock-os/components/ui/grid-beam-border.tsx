"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode
} from "react";

type GridBeamBorderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  color?: string;
  active?: boolean;
  duration?: number;
  strength?: number;
  breathe?: boolean;
  borderRadius?: number;
};

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function GridBeamBorder({
  children,
  color = "#8F0000",
  active = true,
  duration = 3.2,
  strength = 1,
  breathe = true,
  borderRadius = 16,
  className = "",
  style,
  ...props
}: GridBeamBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = 0;
    let height = 0;
    let visible = true;
    let frame: number | null = null;
    const startedAt = performance.now();

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const inset = 1.25;
      const w = Math.max(0, width - inset * 2);
      const h = Math.max(0, height - inset * 2);
      const radius = Math.max(0, borderRadius - inset);

      roundedRectPath(ctx, inset, inset, w, h, radius);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 1.1;
      ctx.stroke();

      if (active && !reducedMotion && width > 0 && height > 0) {
        const elapsed = (now - startedAt) / 1000;
        const perimeter = Math.max(
          1,
          2 * (w + h) - 8 * radius + 2 * Math.PI * radius
        );
        const beamLength = Math.max(38, Math.min(perimeter * 0.19, 140));
        const progress = (elapsed / Math.max(duration, 0.5)) % 1;
        const pulse = breathe ? 0.84 + Math.sin(elapsed * 2.15) * 0.16 : 1;

        roundedRectPath(ctx, inset, inset, w, h, radius);
        ctx.globalAlpha = Math.min(1, 0.92 * strength * pulse);
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.setLineDash([beamLength, Math.max(1, perimeter - beamLength)]);
        ctx.lineDashOffset = -progress * perimeter;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * strength;
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;

      if (visible && document.visibilityState === "visible") {
        frame = requestAnimationFrame(draw);
      } else {
        frame = null;
      }
    };

    const resume = () => {
      if (frame === null && visible && document.visibilityState === "visible") {
        frame = requestAnimationFrame(draw);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      resume();
    });
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (!visible && frame !== null) {
          cancelAnimationFrame(frame);
          frame = null;
        } else {
          resume();
        }
      },
      { rootMargin: "120px" }
    );
    intersectionObserver.observe(root);

    const onVisibility = () => {
      if (document.visibilityState !== "visible" && frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      } else {
        resume();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    resize();
    frame = requestAnimationFrame(draw);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, borderRadius, breathe, color, duration, strength]);

  return (
    <div
      ref={rootRef}
      className={"relative overflow-hidden " + className}
      style={
        {
          borderRadius,
          ...style
        } as CSSProperties
      }
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
      />
      <div className="relative z-[3]">{children}</div>
    </div>
  );
}
