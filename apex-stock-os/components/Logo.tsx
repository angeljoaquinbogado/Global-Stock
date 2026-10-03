import type { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement> & {
  withWordmark?: boolean;
};

export function Logo({
  withWordmark = false,
  className,
  ...props
}: LogoProps) {
  if (withWordmark) {
    return (
      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        <LogoMark className="h-10 w-10 shrink-0" />
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-[-0.035em]">
            Global Stock
          </div>
          <div className="mt-1 text-[8px] font-semibold uppercase tracking-[.18em] opacity-40">
            Business Control
          </div>
        </div>
      </div>
    );
  }

  return <LogoMark className={className} {...props} />;
}

function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Global Stock"
      {...props}
    >
      <defs>
        <filter id="gs-logo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.20  0 0.25 0 0 0  0 0 0.25 0 0  0 0 0 .34 0"
          />
        </filter>
      </defs>

      <circle
        cx="32"
        cy="32"
        r="25.5"
        fill="#8F0000"
        opacity=".15"
        filter="url(#gs-logo-glow)"
      />

      <image
        href="/global-stock-earth.png"
        x="0"
        y="0"
        width="64"
        height="64"
        preserveAspectRatio="xMidYMid meet"
      />

      <circle
        cx="32"
        cy="32"
        r="27.5"
        stroke="rgba(255,255,255,.13)"
        strokeWidth="1"
      />
    </svg>
  );
}
