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
        <LogoMark className="h-10 w-10 shrink-0" aria-hidden="true" />
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-[-0.03em]">
            Global Stock
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
        <linearGradient id="gs-logo-front" x1="10" y1="8" x2="48" y2="56">
          <stop stopColor="#D20A12" />
          <stop offset=".52" stopColor="#A90008" />
          <stop offset="1" stopColor="#780006" />
        </linearGradient>
        <linearGradient id="gs-logo-side" x1="53" y1="17" x2="32" y2="54">
          <stop stopColor="#A70008" />
          <stop offset="1" stopColor="#630005" />
        </linearGradient>
        <linearGradient id="gs-logo-top" x1="18" y1="10" x2="48" y2="24">
          <stop stopColor="#E31119" />
          <stop offset="1" stopColor="#9B0007" />
        </linearGradient>
      </defs>

      <path
        d="M32 5.2 53.3 17.5v24.7L32 54.5 10.7 42.2V17.5L32 5.2Z"
        fill="url(#gs-logo-front)"
      />
      <path
        d="m32 5.2 21.3 12.3L32 29.8 10.7 17.5 32 5.2Z"
        fill="url(#gs-logo-top)"
      />
      <path
        d="M32 29.8 53.3 17.5v24.7L32 54.5V29.8Z"
        fill="url(#gs-logo-side)"
      />
      <path
        d="M10.7 17.5 32 29.8v24.7L10.7 42.2V17.5Z"
        fill="#950008"
        opacity=".8"
      />

      <path
        d="M19.4 25.1v13.8M25.6 28.5v14.1M31.8 32v13.6"
        stroke="white"
        strokeWidth="3.7"
        strokeLinecap="round"
      />

      <path
        d="m39.2 23 4.8 2.8v11.9l-4.8 2.8V23Z"
        fill="white"
      />

      <circle cx="46.9" cy="20.7" r="2.2" fill="white" />
      <circle cx="46.9" cy="43.2" r="2.2" fill="white" />
      <path
        d="M46.9 23.1v17.7"
        stroke="white"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeDasharray="2.3 3.2"
      />
    </svg>
  );
}
