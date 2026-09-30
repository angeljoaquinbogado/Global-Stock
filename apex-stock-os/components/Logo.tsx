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
          <div className="text-[15px] font-semibold tracking-[-0.03em]">
            Global Stock
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--apex-muted)]">
            OS
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
        <linearGradient id="apex-face-a" x1="10" y1="8" x2="51" y2="57">
          <stop stopColor="#B70000" />
          <stop offset="1" stopColor="#6A0000" />
        </linearGradient>
        <linearGradient id="apex-face-b" x1="44" y1="15" x2="29" y2="54">
          <stop stopColor="#8F0000" />
          <stop offset="1" stopColor="#4F0000" />
        </linearGradient>
      </defs>

      <path
        d="M31.999 5.4 53.1 17.58v24.36L31.999 54.12 10.9 41.94V17.58L31.999 5.4Z"
        fill="url(#apex-face-a)"
      />
      <path
        d="m32 5.4 21.1 12.18L32 29.76 10.9 17.58 32 5.4Z"
        fill="#A50000"
      />
      <path
        d="M32 29.76 53.1 17.58v24.36L32 54.12V29.76Z"
        fill="url(#apex-face-b)"
      />
      <path
        d="M10.9 17.58 32 29.76v24.36L10.9 41.94V17.58Z"
        fill="#790000"
      />

      <path
        d="M19.6 24.9v14.2M25.7 28.3v14.3M31.8 31.8v14.2"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="m39.1 22.8 4.8 2.75v12.2l-4.8 2.77V22.8Z"
        fill="white"
        fillOpacity=".96"
      />
      <circle cx="46.7" cy="20.45" r="2.35" fill="white" />
      <circle cx="46.7" cy="43.2" r="2.35" fill="white" />
      <path
        d="M46.7 22.8v18.1"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2.4 3.3"
      />
    </svg>
  );
}
